import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useImageIdentification } from './useImageIdentification';
import { ImageUploadState } from '@/components/GenerateSinglePage/types';

interface UseImageUploadProps {
  user: { id: string } | null;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function useImageUpload({ user, onError, onSuccess }: UseImageUploadProps) {
  const { identifyImages } = useImageIdentification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<ImageUploadState>({
    originalImage: null,
    originalImageFile: null,
    uploadedImageUrl: null,
    isDragging: false,
    isValidatingImage: false,
  });

  const uploadImageToMinio = async (dataUrl: string): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('未登录，跳过上传到 MinIO');
        return;
      }

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          image: dataUrl,
          folder: 'generate-single/uploads',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setUploadState(prev => ({
          ...prev,
          uploadedImageUrl: result.presignedUrl || result.url,
        }));
        console.log('图片已上传到 MinIO:', result.url);
      } else {
        console.warn('上传到 MinIO 失败，将使用 dataURL');
      }
    } catch (err) {
      console.warn('上传到 MinIO 异常:', err);
    }
  };

  const processFile = async (file: File): Promise<void> => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      onError('请选择图片文件！');
      // 重置文件输入，允许重新选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError('图片文件不能超过10MB！');
      // 重置文件输入，允许重新选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    onError('');
    onSuccess('');
    setUploadState(prev => ({ ...prev, isValidatingImage: true }));

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;

      try {
        // 检查用户是否登录
        if (!user) {
          // 未登录用户，跳过识别
          setUploadState(prev => ({
            ...prev,
            originalImage: dataUrl,
            originalImageFile: file,
            isValidatingImage: false,
          }));
          return;
        }

        // 调用识别接口验证图片是否包含人物
        const identifyResult = await identifyImages([dataUrl]);

        if (!identifyResult.allValid) {
          // 图片不包含人物
          const invalidResult = identifyResult.results.find(r => !r.hasPerson);
          onError(
            `检测到图片未包含人物：${invalidResult?.description || '请上传包含人物的照片'}。\n请重新选择包含人物的照片。`
          );
          setUploadState(prev => ({ ...prev, isValidatingImage: false }));
          // 重置文件输入，允许重新选择相同文件
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }

        // 验证通过，设置图片
        setUploadState(prev => ({
          ...prev,
          originalImage: dataUrl,
          originalImageFile: file,
          isValidatingImage: false,
        }));
        onSuccess('图片验证通过！');

        // 上传到 MinIO
        await uploadImageToMinio(dataUrl);

      } catch (err) {
        console.error('图片验证失败:', err);
        onError(err instanceof Error ? err.message : '图片验证失败，请重试');
        setUploadState(prev => ({ ...prev, isValidatingImage: false }));
        // 重置文件输入，允许重新选择相同文件
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: true }));
  };

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: false }));
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: false }));
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  return {
    uploadState,
    fileInputRef,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
