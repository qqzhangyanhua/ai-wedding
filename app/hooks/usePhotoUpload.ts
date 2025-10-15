import { useState, useCallback } from 'react';
import { checkImageQuality } from '@/lib/image-quality-checker';
import { PhotoWithQuality } from '@/types/photo';
import { supabase } from '@/lib/supabase';

interface UsePhotoUploadOptions {
  maxPhotos: number;
  onPhotosChange: (urls: string[]) => void;
}

interface IdentifyResult {
  hasPerson: boolean;
  description: string;
}

export function usePhotoUpload({ maxPhotos, onPhotosChange }: UsePhotoUploadOptions) {
  const [photosWithQuality, setPhotosWithQuality] = useState<PhotoWithQuality[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [identifyErrors, setIdentifyErrors] = useState<Map<number, string>>(new Map());
  const [criticalError, setCriticalError] = useState<string | null>(null);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * 识别图片是否包含人物
   * @throws Error 当识别 API 失败时抛出错误
   */
  const identifyPerson = async (dataUrl: string): Promise<IdentifyResult> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 如果未登录，跳过验证
    if (!session) {
      return { hasPerson: true, description: '未登录，跳过验证' };
    }

    const response = await fetch('/api/identify-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ images: [dataUrl] }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '未知错误' }));
      throw new Error(errorData.error || `识别请求失败: ${response.status}`);
    }

    const result = await response.json();
    const firstResult = result.results?.[0];

    // 检查识别是否成功
    if (!firstResult) {
      throw new Error('识别结果为空');
    }

    if (!firstResult.success) {
      // 识别 API 调用失败，抛出详细错误
      const errorMsg = firstResult.description || '识别服务失败';
      throw new Error(errorMsg);
    }

    return {
      hasPerson: firstResult.hasPerson,
      description: firstResult.description,
    };
  };

  const uploadToMinio = async (dataUrl: string): Promise<string | undefined> => {
    try {
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, folder: 'uploads' }),
      });

      if (!uploadResponse.ok) {
        throw new Error(`上传失败: ${uploadResponse.statusText}`);
      }

      const uploadResult = await uploadResponse.json();
      return uploadResult.url;
    } catch (uploadError) {
      console.error('上传到 MinIO 失败:', uploadError);
      return undefined;
    }
  };

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      setIsAnalyzing(true);
      setCriticalError(null); // 清除之前的错误
      const newPhotos: PhotoWithQuality[] = [];
      const newErrors = new Map(identifyErrors);

      try {
        for (let i = 0; i < files.length; i++) {
          if (photosWithQuality.length + newPhotos.length >= maxPhotos) break;

          const file = files[i];
          const dataUrl = await fileToDataUrl(file);
          const currentIndex = photosWithQuality.length + newPhotos.length;

          try {
            // 1. 先识别图片是否包含人物
            const identifyResult = await identifyPerson(dataUrl);
            
            if (!identifyResult.hasPerson) {
              // 不包含人物，不上传到 MinIO，记录错误
              console.warn(`图片 ${file.name} 未检测到人物: ${identifyResult.description}`);
              newErrors.set(currentIndex, `未检测到人物: ${identifyResult.description}`);
              newPhotos.push({ dataUrl }); // 只保存 dataUrl，不上传
              continue;
            }

            // 2. 包含人物，继续质量检查
            const quality = await checkImageQuality(dataUrl);
            
            // 3. 上传到 MinIO
            const minioUrl = await uploadToMinio(dataUrl);
            
            // 清除该索引的错误（如果有）
            newErrors.delete(currentIndex);
            
            newPhotos.push({ dataUrl, minioUrl, quality });
          } catch (error) {
            // 识别 API 失败，这是致命错误，中止整个上传流程
            const errorMessage = error instanceof Error ? error.message : '识别服务失败';
            console.error('识别图片失败:', errorMessage);
            
            // 设置致命错误，触发弹窗
            setCriticalError(errorMessage);
            
            // 中止上传流程
            setIsAnalyzing(false);
            return;
          }
        }

        const updated = [...photosWithQuality, ...newPhotos];
        setPhotosWithQuality(updated);
        setIdentifyErrors(newErrors);
        onPhotosChange(updated.map(p => p.minioUrl || p.dataUrl));
      } finally {
        setIsAnalyzing(false);
      }
    },
    [photosWithQuality, maxPhotos, onPhotosChange, identifyErrors]
  );

  const removePhoto = useCallback(
    (index: number) => {
      const updated = photosWithQuality.filter((_, i) => i !== index);
      setPhotosWithQuality(updated);
      
      // 更新错误映射（重新索引）
      const newErrors = new Map<number, string>();
      identifyErrors.forEach((error, idx) => {
        if (idx < index) {
          newErrors.set(idx, error);
        } else if (idx > index) {
          newErrors.set(idx - 1, error);
        }
      });
      setIdentifyErrors(newErrors);
      
      onPhotosChange(updated.map(p => p.minioUrl || p.dataUrl));
    },
    [photosWithQuality, onPhotosChange, identifyErrors]
  );

  const reorderPhotos = useCallback(
    (reordered: PhotoWithQuality[]) => {
      setPhotosWithQuality(reordered);
      onPhotosChange(reordered.map(p => p.minioUrl || p.dataUrl));
    },
    [onPhotosChange]
  );

  const clearAllPhotos = useCallback(() => {
    setPhotosWithQuality([]);
    setIdentifyErrors(new Map());
    onPhotosChange([]);
  }, [onPhotosChange]);

  const deletePoorQualityPhotos = useCallback(() => {
    const updated = photosWithQuality.filter(p => p.quality?.status !== 'poor');
    setPhotosWithQuality(updated);
    onPhotosChange(updated.map(p => p.minioUrl || p.dataUrl));
  }, [photosWithQuality, onPhotosChange]);

  const syncPhotos = useCallback(
    (externalPhotos: string[]) => {
      if (photosWithQuality.length !== externalPhotos.length) {
        const synced = externalPhotos.map((url, i) => photosWithQuality[i] || { dataUrl: url });
        setPhotosWithQuality(synced);
      }
    },
    [photosWithQuality]
  );

  const poorQualityCount = photosWithQuality.filter(p => p.quality?.status === 'poor').length;
  const identifyErrorCount = identifyErrors.size;

  return {
    photosWithQuality,
    isAnalyzing,
    poorQualityCount,
    identifyErrors,
    identifyErrorCount,
    criticalError,
    clearCriticalError: () => setCriticalError(null),
    handleFileSelect,
    removePhoto,
    reorderPhotos,
    clearAllPhotos,
    deletePoorQualityPhotos,
    syncPhotos,
  };
}
