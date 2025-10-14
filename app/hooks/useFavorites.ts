import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      setLoading(false);
      return;
    }

    async function fetchFavorites() {
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('template_id');

        if (error) throw error;

        const favoriteIds = new Set(data?.map(f => f.template_id) || []);
        setFavorites(favoriteIds);
      } catch (err) {
        console.error('获取收藏失败:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [user]);

  const toggleFavorite = async (templateId: string) => {
    if (!user) return;

    const newFavorites = new Set(favorites);
    const isFavorited = favorites.has(templateId);

    if (isFavorited) {
      newFavorites.delete(templateId);
      setFavorites(newFavorites);

      const { error } = await supabase
        .from('favorites')
        .delete()
        .match({ user_id: user.id, template_id: templateId });

      if (error) {
        newFavorites.add(templateId);
        setFavorites(newFavorites);
        console.error('取消收藏失败:', error);
      }
    } else {
      newFavorites.add(templateId);
      setFavorites(newFavorites);

      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, template_id: templateId });

      if (error) {
        newFavorites.delete(templateId);
        setFavorites(newFavorites);
        console.error('添加收藏失败:', error);
      }
    }
  };

  return { favorites, loading, toggleFavorite };
}
