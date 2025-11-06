import { Loader2 } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import { EmptyState } from './EmptyState';
import type { ProjectWithTemplate } from '@/types/database';

interface ProjectListProps {
  projects: ProjectWithTemplate[];
  loading: boolean;
  onProjectClick: (project: ProjectWithTemplate) => void;
  onView: (project: ProjectWithTemplate) => void;
  onEdit: (project: ProjectWithTemplate) => void;
  onDelete: (project: ProjectWithTemplate) => void;
  onShare: (project: ProjectWithTemplate) => void;
  onDownload: (project: ProjectWithTemplate) => void;
  onToggleGalleryShare: (generationId: string, isShared: boolean) => void;
  onNavigateToTemplates: () => void;
  getTimeAgo: (dateString: string) => string;
}

export function ProjectList({
  projects,
  loading,
  onProjectClick,
  onView,
  onEdit,
  onDelete,
  onShare,
  onDownload,
  onToggleGalleryShare,
  onNavigateToTemplates,
  getTimeAgo,
}: ProjectListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-dusty-rose" />
      </div>
    );
  }

  if (projects.length === 0) {
    return <EmptyState type="projects" onAction={onNavigateToTemplates} />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={() => onProjectClick(project)}
          onView={() => onView(project)}
          onEdit={() => onEdit(project)}
          onDelete={() => onDelete(project)}
          onShare={() => onShare(project)}
          onDownload={() => onDownload(project)}
          onToggleGalleryShare={isShared => {
            if (project.generation?.id) {
              onToggleGalleryShare(project.generation.id, isShared);
            }
          }}
          getTimeAgo={getTimeAgo}
        />
      ))}
    </div>
  );
}

