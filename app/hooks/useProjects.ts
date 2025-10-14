import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ProjectWithTemplate } from '@/types/database';

interface UseProjectsOptions {
  pageSize?: number;
  initialLoad?: boolean;
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { pageSize = 20, initialLoad = true } = options;
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithTemplate[]>([]);
  const [loading, setLoading] = useState(initialLoad);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchProjects = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const from = pageNum * pageSize;
      const to = from + pageSize - 1;

      // 使用 LEFT JOIN 而不是 INNER JOIN，这样即使没有 generation 也能查询到项目
      // generations!left 表示左连接（可选关系），返回所有项目
      const { data, error, count } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          uploaded_photos,
          created_at,
          updated_at,
          generations!left (
            id,
            status,
            preview_images,
            high_res_images,
            is_shared_to_gallery,
            completed_at,
            created_at,
            template_id,
            template:templates (
              id,
              name,
              preview_image_url
            )
          )
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProjects: ProjectWithTemplate[] = data?.map(project => {
        // LEFT JOIN 返回的 generations 是数组，可能为空
        const allGenerations = Array.isArray(project.generations) ? project.generations : [];

        // 按创建时间排序，取最新的一个
        const sortedGenerations = allGenerations
          .filter(g => g && g.id) // 过滤掉 null 或无效记录
          .sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA; // 降序，最新的在前
          });

        const latestGeneration = sortedGenerations[0];

        // 模板信息优先从 generation 的关联中获取
        const template = latestGeneration?.template
          ? (Array.isArray(latestGeneration.template)
              ? latestGeneration.template[0]
              : latestGeneration.template)
          : undefined;

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          uploaded_photos: project.uploaded_photos || [],
          created_at: project.created_at,
          updated_at: project.updated_at,
          template: template ? {
            id: template.id,
            name: template.name,
            preview_image_url: template.preview_image_url,
          } : undefined,
          generation: latestGeneration ? {
            id: latestGeneration.id,
            status: latestGeneration.status,
            preview_images: Array.isArray(latestGeneration.preview_images)
              ? latestGeneration.preview_images
              : [],
            high_res_images: Array.isArray(latestGeneration.high_res_images)
              ? latestGeneration.high_res_images
              : [],
            is_shared_to_gallery: latestGeneration.is_shared_to_gallery || false,
            completed_at: latestGeneration.completed_at || '',
          } : undefined,
        };
      }) || [];

      if (append) {
        setProjects(prev => [...prev, ...formattedProjects]);
      } else {
        setProjects(formattedProjects);
      }

      setHasMore(count ? (from + pageSize) < count : false);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取项目失败');
    } finally {
      setLoading(false);
    }
  }, [user, pageSize]);

  useEffect(() => {
    if (initialLoad) {
      fetchProjects(0, false);
    }
  }, [fetchProjects, initialLoad]);

  const refreshProjects = async () => {
    await fetchProjects(0, false);
  };

  const loadMore = async () => {
    if (!loading && hasMore) {
      await fetchProjects(page + 1, true);
    }
  };

  return {
    projects,
    loading,
    error,
    hasMore,
    page,
    refreshProjects,
    loadMore,
  };
}
