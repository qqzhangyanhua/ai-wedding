import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Template } from '@/types/database';

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (error) throw error;
        setTemplates(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取模板失败');
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  return { templates, loading, error };
}
