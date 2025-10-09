import { useState, useEffect } from 'react';
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

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    async function fetchProjects() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
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
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedProjects = data?.map(project => {
          const latestGeneration = project.generations?.[0];
          return {
            ...project,
            template: latestGeneration?.template,
            generation: latestGeneration
          };
        }) || [];

        setProjects(formattedProjects);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取项目失败');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [user]);

  const refreshProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
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
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProjects = data?.map(project => {
        const latestGeneration = project.generations?.[0];
        return {
          ...project,
          template: latestGeneration?.template,
          generation: latestGeneration
        };
      }) || [];

      setProjects(formattedProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新项目失败');
    } finally {
      setLoading(false);
    }
  };

  return { projects, loading, error, refreshProjects };
}
