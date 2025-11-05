import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ModelConfigSource } from '@/types/model-config';

export interface UseAvailableSourcesResult {
  sources: ModelConfigSource[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch available model sources from active configurations
 */
export function useAvailableSources(): UseAvailableSourcesResult {
  const [sources, setSources] = useState<ModelConfigSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError('未登录');
        setSources([]);
        return;
      }

      const response = await fetch('/api/model-sources/available', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取可用模型来源失败');
      }

      const data = await response.json();
      setSources(data.sources || []);
    } catch (err) {
      console.error('获取可用模型来源出错:', err);
      setError(err instanceof Error ? err.message : '获取可用模型来源失败');
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  return {
    sources,
    loading,
    error,
    refetch: fetchSources,
  };
}
