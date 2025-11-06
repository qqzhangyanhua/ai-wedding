import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SingleGeneration } from '@/types/database';

interface UseSingleGenerationsOptions {
  pageSize?: number;
  initialLoad?: boolean;
}

export function useSingleGenerations(options: UseSingleGenerationsOptions = {}) {
  const { pageSize = 20, initialLoad = true } = options;
  const { user } = useAuth();
  const [generations, setGenerations] = useState<SingleGeneration[]>([]);
  const [loading, setLoading] = useState(initialLoad);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchGenerations = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    if (!user) {
      setGenerations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const from = pageNum * pageSize;
      const to = from + pageSize - 1;

      const { data, error: fetchError, count } = await supabase
        .from('single_generations')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      const formattedGenerations: SingleGeneration[] = data || [];

      if (append) {
        setGenerations(prev => [...prev, ...formattedGenerations]);
      } else {
        setGenerations(formattedGenerations);
      }

      setHasMore(count ? (from + pageSize) < count : false);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取单张生成历史失败');
      console.error('获取单张生成历史失败:', err);
    } finally {
      setLoading(false);
    }
  }, [user, pageSize]);

  useEffect(() => {
    if (initialLoad) {
      fetchGenerations(0, false);
    }
  }, [fetchGenerations, initialLoad]);

  const refreshGenerations = async () => {
    await fetchGenerations(0, false);
  };

  const loadMore = async () => {
    if (!loading && hasMore) {
      await fetchGenerations(page + 1, true);
    }
  };

  const deleteGeneration = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('single_generations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // 从本地状态中移除
      setGenerations(prev => prev.filter(gen => gen.id !== id));
      return true;
    } catch (err) {
      console.error('删除单张生成记录失败:', err);
      throw err;
    }
  };

  return {
    generations,
    loading,
    error,
    hasMore,
    page,
    refreshGenerations,
    loadMore,
    deleteGeneration,
  };
}

