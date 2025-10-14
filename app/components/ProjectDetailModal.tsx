import { useState } from 'react';
import { X, Calendar, Camera, Sparkles, Eye, Download, Share2, RefreshCw, ZoomIn, Edit } from 'lucide-react';
import Image from 'next/image';
import { ProjectWithTemplate } from '@/types/database';
import { getStatusLabel, getStatusVisual } from '@/lib/status';
import { GlassCard } from '@/components/react-bits';

interface ProjectDetailModalProps {
  project: ProjectWithTemplate;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onView?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

export function ProjectDetailModal({
  project,
  isOpen,
  onClose,
  onEdit,
  onView,
  onShare,
  onDownload,
}: ProjectDetailModalProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  if (!isOpen) return null;

  const status = project.generation?.status || project.status;
  
  // 安全的状态类型转换
  const allowed = ['completed', 'failed'] as const;
  type AllowedStatus = typeof allowed[number];
  const safeStatus: AllowedStatus = (allowed as readonly string[]).includes(status)
    ? (status as AllowedStatus)
    : 'completed';
  
  const { icon, colorClass, spin } = getStatusVisual(safeStatus);
  const statusLabel = getStatusLabel(safeStatus);
  const isCompleted = status === 'completed';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleImageClick = (index: number) => {
    setSelectedResultIndex(index);
    setIsImageModalOpen(true);
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <GlassCard className="m-4">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-stone/10">
            <div>
              <h2 className="text-2xl font-display font-medium text-navy mb-2">
                {project.name}
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-champagne rounded-full">
                  {icon === 'check' ? (
                    <Eye className={`w-4 h-4 ${colorClass}`} />
                  ) : (
                    <RefreshCw className={`w-4 h-4 ${colorClass} ${spin ? 'animate-spin' : ''}`} />
                  )}
                  <span className="text-sm font-medium text-navy">{statusLabel}</span>
                </div>
                {project.template && (
                  <span className="text-sm text-stone">
                    模板：{project.template.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-stone/10 transition-colors"
              aria-label="关闭"
            >
              <X className="w-6 h-6 text-stone" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左侧：项目信息 */}
              <div className="space-y-6">
                {/* 基本信息 */}
                <div>
                  <h3 className="text-lg font-display font-medium text-navy mb-4">项目信息</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-stone" />
                      <div>
                        <p className="text-sm text-stone">创建时间</p>
                        <p className="text-navy font-medium">{formatDate(project.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 text-stone" />
                      <div>
                        <p className="text-sm text-stone">上传照片</p>
                        <p className="text-navy font-medium">{project.uploaded_photos.length} 张</p>
                      </div>
                    </div>
                    {project.generation?.preview_images && (
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-stone" />
                        <div>
                          <p className="text-sm text-stone">生成结果</p>
                          <p className="text-navy font-medium">{project.generation.preview_images.length} 张预览图</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 模板信息 */}
                {project.template && (
                  <div>
                    <h3 className="text-lg font-display font-medium text-navy mb-4">使用模板</h3>
                    <div className="flex items-center gap-4 p-4 bg-champagne rounded-lg border border-stone/10">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={project.template.preview_image_url}
                          alt={project.template.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-navy">{project.template.name}</h4>
                        <p className="text-sm text-stone">AI 婚纱照模板</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex flex-wrap gap-3">
                  {onView && isCompleted && (
                    <button
                      onClick={onView}
                      className="px-4 py-2 bg-gradient-to-r from-rose-gold to-dusty-rose text-ivory rounded-md hover:shadow-glow transition-all duration-300 font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      查看结果
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="px-4 py-2 bg-champagne text-navy rounded-md hover:bg-ivory transition-all duration-300 font-medium border border-stone/20 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      编辑项目
                    </button>
                  )}
                  {onShare && isCompleted && (
                    <button
                      onClick={onShare}
                      className="px-4 py-2 bg-champagne text-navy rounded-md hover:bg-ivory transition-all duration-300 font-medium border border-stone/20 flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      分享
                    </button>
                  )}
                  {onDownload && isCompleted && (
                    <button
                      onClick={onDownload}
                      className="px-4 py-2 bg-champagne text-navy rounded-md hover:bg-ivory transition-all duration-300 font-medium border border-stone/20 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      下载全部
                    </button>
                  )}
                </div>
              </div>

              {/* 右侧：照片与结果预览 */}
              <div className="space-y-6">
                <h3 className="text-lg font-display font-medium text-navy">上传的照片</h3>
                
                {project.uploaded_photos.length > 0 ? (
                  <div className="space-y-4">
                    {/* 主预览图 */}
                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-champagne">
                      <Image
                        src={project.uploaded_photos[selectedPhotoIndex]}
                        alt={`${project.name} 照片 ${selectedPhotoIndex + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>

                    {/* 缩略图列表 */}
                    {project.uploaded_photos.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {project.uploaded_photos.map((photo, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedPhotoIndex(index)}
                            className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                              selectedPhotoIndex === index
                                ? 'border-dusty-rose shadow-md'
                                : 'border-stone/20 hover:border-stone/40'
                            }`}
                          >
                            <Image
                              src={photo}
                              alt={`${project.name} 缩略图 ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="100px"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center aspect-[4/3] bg-champagne rounded-lg border-2 border-dashed border-stone/30">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-stone/50 mx-auto mb-2" />
                      <p className="text-stone">暂无上传照片</p>
                    </div>
                  </div>
                )}

                {/* 生成结果预览 */}
                {Array.isArray(project.generation?.preview_images) && project.generation?.preview_images.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-display font-medium text-navy">生成结果预览</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {project.generation.preview_images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => handleImageClick(i)}
                          className="relative aspect-[3/4] rounded-md overflow-hidden bg-champagne border-2 border-stone/20 hover:border-dusty-rose transition-all group"
                        >
                          <Image
                            src={img}
                            alt={`生成结果 ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-8 h-8 text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-stone">点击图片查看大图</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>

    {/* 大图查看模态框 */}
    {isImageModalOpen && selectedResultIndex !== null && project.generation?.preview_images && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setIsImageModalOpen(false)}
      >
        <button
          onClick={() => setIsImageModalOpen(false)}
          className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="关闭大图"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <div className="relative w-full max-w-5xl max-h-[90vh] px-4">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-2xl">
            <Image
              src={project.generation.preview_images[selectedResultIndex]}
              alt={`生成结果 ${selectedResultIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* 导航按钮 */}
          {project.generation.preview_images.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedResultIndex((prev) =>
                    prev === null || prev === 0
                      ? (project.generation?.preview_images?.length || 1) - 1
                      : prev - 1
                  );
                }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
              >
                上一张
              </button>
              <span className="text-white font-medium">
                {selectedResultIndex + 1} / {project.generation.preview_images.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedResultIndex((prev) =>
                    prev === null || prev === (project.generation?.preview_images?.length || 1) - 1
                      ? 0
                      : prev + 1
                  );
                }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
              >
                下一张
              </button>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}
