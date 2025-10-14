import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useImageLikes(generationId?: string, imageType: 'preview' | 'high_res' = 'preview') {
  const { user } = useAuth();
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(!!(user && generationId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchLikes() {
      if (!user || !generationId) {
        setLiked(new Set());
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('image_likes')
          .select('image_index')
          .eq('generation_id', generationId)
          .eq('image_type', imageType);
        if (error) throw error;
        if (!active) return;
        setLiked(new Set((data || []).map((r) => r.image_index)));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : '获取收藏失败');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchLikes();
    return () => {
      active = false;
    };
  }, [user, generationId, imageType]);

  const toggleLike = useCallback(
    async (index: number) => {
      if (!user || !generationId) {
        // 未登录或无生成ID：仅本地切换
        setLiked((prev) => {
          const next = new Set(prev);
          if (next.has(index)) next.delete(index);
          else next.add(index);
          return next;
        });
        return;
      }
      const has = liked.has(index);
      const optimistic = new Set(liked);
      if (has) optimistic.delete(index);
      else optimistic.add(index);
      setLiked(optimistic);
      try {
        if (has) {
          const { error } = await supabase
            .from('image_likes')
            .delete()
            .match({ generation_id: generationId, user_id: user.id, image_index: index, image_type: imageType });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('image_likes')
            .insert({ generation_id: generationId, user_id: user.id, image_index: index, image_type: imageType });
          if (error) throw error;
        }
      } catch (err) {
        // 失败回滚
        setLiked(liked);
        setError(err instanceof Error ? err.message : '更新收藏失败');
      }
    },
    [user, generationId, liked, imageType]
  );

  return { liked, loading, error, toggleLike };
}
