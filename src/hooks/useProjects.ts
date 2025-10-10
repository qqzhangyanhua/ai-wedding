import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ProjectWithTemplate {
  id: string;
  name: string;
  status: string;
  uploaded_photos: string[];
  created_at: string;
  updated_at: string;
  template?: {
    id: string;
    name: string;
    preview_image_url: string;
  };
  generation?: {
    id: string;
    status: string;
    preview_images: string[];
    completed_at: string;
  };
}

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

      const { data, error, count } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          uploaded_photos,
          created_at,
          updated_at,
          generations (
            id,
            status,
            preview_images,
            completed_at,
            template:templates (
              id,
              name,
              preview_image_url
            )
          )
        `, { count: 'exact' })
        .range(from, to)
        .limit(1, { foreignTable: 'generations' })
        .order('created_at', { ascending: false, foreignTable: 'generations' })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProjects: ProjectWithTemplate[] = data?.map(project => {
        const latestGeneration = project.generations?.[0];
        const template = Array.isArray(latestGeneration?.template)
          ? latestGeneration.template[0]
          : latestGeneration?.template;
        
        return {
          id: project.id,
          name: project.name,
          status: project.status,
          uploaded_photos: project.uploaded_photos,
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
            preview_images: latestGeneration.preview_images,
            completed_at: latestGeneration.completed_at,
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
