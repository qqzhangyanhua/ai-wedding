import { useState, useCallback } from 'react';
import { checkImageQuality } from '@/lib/image-quality-checker';
import { PhotoWithQuality } from '@/types/photo';

interface UsePhotoUploadOptions {
  maxPhotos: number;
  onPhotosChange: (urls: string[]) => void;
}

export function usePhotoUpload({ maxPhotos, onPhotosChange }: UsePhotoUploadOptions) {
  const [photosWithQuality, setPhotosWithQuality] = useState<PhotoWithQuality[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
      const newPhotos: PhotoWithQuality[] = [];

      for (let i = 0; i < files.length; i++) {
        if (photosWithQuality.length + newPhotos.length >= maxPhotos) break;

        const file = files[i];
        const dataUrl = await fileToDataUrl(file);

        try {
          const quality = await checkImageQuality(dataUrl);
          const minioUrl = await uploadToMinio(dataUrl);
          newPhotos.push({ dataUrl, minioUrl, quality });
        } catch (error) {
          console.error('处理图片失败:', error);
          newPhotos.push({ dataUrl });
        }
      }

      const updated = [...photosWithQuality, ...newPhotos];
      setPhotosWithQuality(updated);
      onPhotosChange(updated.map(p => p.minioUrl || p.dataUrl));
      setIsAnalyzing(false);
    },
    [photosWithQuality, maxPhotos, onPhotosChange]
  );

  const removePhoto = useCallback(
    (index: number) => {
      const updated = photosWithQuality.filter((_, i) => i !== index);
      setPhotosWithQuality(updated);
      onPhotosChange(updated.map(p => p.minioUrl || p.dataUrl));
    },
    [photosWithQuality, onPhotosChange]
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

  return {
    photosWithQuality,
    isAnalyzing,
    poorQualityCount,
    handleFileSelect,
    removePhoto,
    reorderPhotos,
    clearAllPhotos,
    deletePoorQualityPhotos,
    syncPhotos,
  };
}
