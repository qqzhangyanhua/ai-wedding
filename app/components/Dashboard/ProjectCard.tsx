import Image from 'next/image';
import { CheckCircle, AlertCircle, Sparkles, Camera, Loader2, ArrowRight } from 'lucide-react';
import { getStatusLabel, getStatusVisual } from '@/lib/status';
import { ProjectActionsMenu } from '../ProjectActionsMenu';
import type { ProjectWithTemplate } from '@/types/database';

interface ProjectCardProps {
  project: ProjectWithTemplate;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onDownload: () => void;
  onToggleGalleryShare: (isShared: boolean) => void;
  onClick: () => void;
  getTimeAgo: (dateString: string) => string;
}

export function ProjectCard({
  project,
  onView,
  onEdit,
  onDelete,
  onShare,
  onDownload,
  onToggleGalleryShare,
  onClick,
  getTimeAgo,
}: ProjectCardProps) {
  const hasGeneratedImages =
    project.generation?.status === 'completed' &&
    project.generation?.preview_images &&
    project.generation.preview_images.length > 0;

  const displayImage = hasGeneratedImages
    ? project.generation!.preview_images[0]
    : project.template?.preview_image_url ||
      project.uploaded_photos[0] ||
      'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=400';

  const renderStatus = (status: string) => {
    const allowed = ['completed', 'failed'] as const;
    type AllowedStatus = typeof allowed[number];
    const safeStatus: AllowedStatus = (allowed as readonly string[]).includes(status)
      ? (status as AllowedStatus)
      : 'completed';

    const { icon, colorClass } = getStatusVisual(safeStatus);
    const label = getStatusLabel(safeStatus);
    const Icon = icon === 'check' ? CheckCircle : AlertCircle;
    return (
      <>
        <Icon className={`w-5 h-5 ${colorClass}`} />
        <span className="text-sm font-medium text-navy">{label}</span>
      </>
    );
  };

  return (
    <div
      className="overflow-hidden rounded-xl border shadow-md transition-all duration-500 cursor-pointer bg-ivory border-stone/10 hover:shadow-xl hover:border-dusty-rose/30 group"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* 主显示图片 */}
        <Image
          src={displayImage}
          alt={project.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t to-transparent from-navy/70 via-navy/20" />

        {/* 顶部状态栏 */}
        <div className="flex absolute top-3 right-3 left-3 z-10 justify-between items-center">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-ivory/95 backdrop-blur-sm rounded-full shadow-sm">
            {renderStatus(project.generation?.status || project.status)}
          </div>

          <div className="rounded-md shadow-sm backdrop-blur-sm bg-ivory/95">
            <ProjectActionsMenu
              projectId={project.id}
              projectName={project.name}
              status={project.generation?.status || project.status}
              isSharedToGallery={project.generation?.is_shared_to_gallery}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onShare={onShare}
              onDownload={onDownload}
              onToggleGalleryShare={onToggleGalleryShare}
            />
          </div>
        </div>

        {/* 已完成的生成结果 - 显示缩略图网格 */}
        {hasGeneratedImages && project.generation!.preview_images.length > 1 && (
          <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {project.generation!.preview_images.slice(0, 4).map((img, idx) => (
              <div
                key={idx}
                className="overflow-hidden relative flex-shrink-0 w-14 h-14 rounded-md border-2 shadow-lg border-ivory"
              >
                <Image
                  src={img}
                  alt={`结果 ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            ))}
            {project.generation!.preview_images.length > 4 && (
              <div className="flex flex-shrink-0 justify-center items-center w-14 h-14 rounded-md border-2 shadow-lg backdrop-blur-sm bg-navy/80 border-ivory">
                <span className="text-xs font-medium text-ivory">
                  +{project.generation!.preview_images.length - 4}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 已完成但只有1张图 - 显示查看按钮 */}
        {hasGeneratedImages && project.generation!.preview_images.length === 1 && (
          <div className="absolute right-3 bottom-3 left-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <button className="w-full px-4 py-2.5 bg-ivory text-navy rounded-lg hover:bg-champagne transition-all duration-300 font-medium flex items-center justify-center gap-2 shadow-lg">
              查看结果
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 未完成 - 显示进度提示 */}
        {!hasGeneratedImages && project.generation?.status !== 'failed' && (
          <div className="absolute right-3 bottom-3 left-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="w-full px-4 py-2.5 bg-navy/80 backdrop-blur-sm text-ivory rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              生成中...
            </div>
          </div>
        )}
      </div>

      {/* 卡片信息区域 */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="mb-1 text-lg font-medium transition-colors font-display text-navy group-hover:text-dusty-rose line-clamp-1">
            {project.name}
          </h3>
          <p className="text-sm text-stone line-clamp-1">
            模板：{project.template?.name || '未选择'}
          </p>
        </div>

        <div className="flex justify-between items-center pt-2 text-sm border-t border-stone/10">
          <div className="flex gap-3 items-center">
            {hasGeneratedImages && (
              <div className="flex items-center gap-1.5 text-dusty-rose font-medium">
                <Sparkles className="w-4 h-4" />
                {project.generation!.preview_images.length} 张作品
              </div>
            )}
            {!hasGeneratedImages && project.uploaded_photos.length > 0 && (
              <div className="flex items-center gap-1.5 text-stone">
                <Camera className="w-4 h-4" />
                {project.uploaded_photos.length} 张照片
              </div>
            )}
          </div>
          <span className="text-stone/70">{getTimeAgo(project.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

