import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface GenerationStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  preview_images?: string[];
  error_message?: string;
  completed_at?: string;
  project: {
    name: string;
  };
  template: {
    name: string;
  };
}

export function useGenerationPolling(generationId: string | null, enabled: boolean = false) {
  const [generation, setGeneration] = useState<GenerationStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchGeneration = useCallback(async () => {
    if (!generationId) return null;

    try {
      const { data, error } = await supabase
        .from('generations')
        .select(`
          *,
          project:projects(name),
          template:templates(name)
        `)
        .eq('id', generationId)
        .maybeSingle();

      if (error) throw error;
      return data as GenerationStatus;
    } catch (error) {
      console.error('获取生成状态失败:', error);
      return null;
    }
  }, [generationId]);

  useEffect(() => {
    if (!enabled || !generationId) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    let pollInterval: NodeJS.Timeout;

    // 根据当前状态动态调整轮询间隔
    const startPolling = (currentStatus?: string) => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      // pending 状态用较长间隔（10秒），processing 状态用短间隔（3秒）
      const interval = currentStatus === 'pending' ? 10000 : 3000;

      pollInterval = setInterval(async () => {
        const data = await fetchGeneration();
        if (data) {
          setGeneration(data);
          
          if (data.status === 'completed' || data.status === 'failed') {
            setIsPolling(false);
            clearInterval(pollInterval);
          } else if (data.status !== currentStatus) {
            // 状态改变时，重新设置轮询间隔
            startPolling(data.status);
          }
        }
      }, interval);
    };

    // 初始获取
    fetchGeneration().then(data => {
      if (data) {
        setGeneration(data);
        startPolling(data.status);
      } else {
        startPolling();
      }
    });

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      setIsPolling(false);
    };
  }, [generationId, enabled, fetchGeneration]);

  return { generation, isPolling, refetch: fetchGeneration };
}
