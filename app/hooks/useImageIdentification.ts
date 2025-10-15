import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface IdentifyResult {
  index: number;
  success: boolean;
  hasPerson: boolean;
  confidence: number;
  description: string;
}

interface IdentifyResponse {
  success: boolean;
  total: number;
  validCount: number;
  invalidCount: number;
  results: IdentifyResult[];
  allValid: boolean;
}

interface UseImageIdentificationReturn {
  isIdentifying: boolean;
  identifyImages: (images: string[]) => Promise<IdentifyResponse>;
  error: string | null;
}

/**
 * 图片识别 Hook
 * 用于验证上传的图片是否包含人物
 */
export function useImageIdentification(): UseImageIdentificationReturn {
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const identifyImages = async (images: string[]): Promise<IdentifyResponse> => {
    setIsIdentifying(true);
    setError(null);

    try {
      // 获取当前会话
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('未登录，无法进行图片识别');
      }

      // 调用识别 API
      const response = await fetch('/api/identify-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ images }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '图片识别失败');
      }

      const result: IdentifyResponse = await response.json();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '图片识别失败';
      setError(message);
      throw err;
    } finally {
      setIsIdentifying(false);
    }
  };

  return {
    isIdentifying,
    identifyImages,
    error,
  };
}

