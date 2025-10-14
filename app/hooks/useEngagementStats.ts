import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useEngagementStats() {
  const { user } = useAuth();
  const [likes, setLikes] = useState(0);
  const [downloads, setDownloads] = useState(0);
  const [loading, setLoading] = useState(!!user);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchStats() {
      if (!user) {
        setLikes(0);
        setDownloads(0);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('image_engagement_stats')
          .select('*');
        if (error) throw error;
        if (!active) return;
        const rows = data || [] as Array<{ likes_count: number; downloads_count: number }>;
        const l = rows.reduce((sum, r) => sum + (Number(r.likes_count) || 0), 0);
        const d = rows.reduce((sum, r) => sum + (Number(r.downloads_count) || 0), 0);
        setLikes(l);
        setDownloads(d);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : '获取互动统计失败');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchStats();
    return () => { active = false; };
  }, [user]);

  return { likes, downloads, loading, error };
}

