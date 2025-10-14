import { useState, useMemo } from 'react';
import { Camera, CheckCircle, AlertCircle, Plus, ArrowRight, Sparkles, Loader2, Heart, Download, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { getStatusLabel, getStatusVisual } from '@/lib/status';
import { Template, ProjectWithTemplate } from '@/types/database';
//
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useEngagementStats } from '@/hooks/useEngagementStats';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { ProjectFilters } from './ProjectFilters';
import type { FilterState } from '@/types/filters';
import { ProjectActionsMenu } from './ProjectActionsMenu';
import { ProjectStatsChart } from './ProjectStatsChart';
import { FadeIn, GlassCard } from '@/components/react-bits';
import { StatCard } from './StatCard';
import { ConfirmDialog } from './ConfirmDialog';
import { Toast } from './Toast';
import { ProjectDetailModal } from './ProjectDetailModal';
import { ProjectEditModal } from './ProjectEditModal';
import { supabase } from '@/lib/supabase';

interface DashboardPageProps {
  onNavigate: (page: string, template?: Template, generationId?: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { profile, refreshProfile, user } = useAuth();
  const { projects, loading, refreshProjects } = useProjects();
  const [activeTab, setActiveTab] = useState<'all' | 'completed'>('all');
  const { likes, downloads } = useEngagementStats();
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: 'all',
    dateRange: 'all',
    templateName: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectWithTemplate | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectWithTemplate | null>(null);


  // 手动刷新项目列表
  const handleManualRefresh = async () => {
    console.log('手动刷新项目列表...');
    await refreshProjects();
    setToast({ message: '项目列表已刷新', type: 'success' });
  };

  // 项目标签页配置
  const tabs: { id: typeof activeTab; label: string; count: number }[] = [
    { id: 'all', label: '所有项目', count: projects.length },
    { id: 'completed', label: '已完成', count: projects.filter(p => p.generation?.status === 'completed').length },
  ];

  // 获取所有模板名称
  const templateNames = useMemo(() => {
    const names = new Set<string>();
    projects.forEach(p => {
      if (p.template?.name) names.add(p.template.name);
    });
    return Array.from(names).sort();
  }, [projects]);

  // 应用筛选逻辑
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Tab筛选
      if (activeTab === 'completed' && project.generation?.status !== 'completed') return false;

      // 搜索关键词
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = project.name.toLowerCase().includes(query);
        const matchTemplate = project.template?.name?.toLowerCase().includes(query);
        if (!matchName && !matchTemplate) return false;
      }

      // 状态筛选
      if (filters.status !== 'all') {
        if (project.generation?.status !== filters.status) {
          return false;
        }
      }

      // 日期范围筛选
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const createdAt = new Date(project.created_at);
        const diffMs = now.getTime() - createdAt.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (filters.dateRange === 'today' && diffDays > 1) return false;
        if (filters.dateRange === 'week' && diffDays > 7) return false;
        if (filters.dateRange === 'month' && diffDays > 30) return false;
      }

      // 模板筛选
      if (filters.templateName && project.template?.name !== filters.templateName) {
        return false;
      }

      return true;
    });
  }, [projects, activeTab, filters]);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return '刚刚';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}天前`;
    return `${Math.floor(seconds / 604800)}周前`;
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setToast({ message: '项目已删除', type: 'success' });
      await refreshProjects();
    } catch (error) {
      console.error('删除项目失败:', error);
      setToast({ message: '删除失败，请重试', type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleUpdateProject = async (projectId: string, updatedData: Partial<ProjectWithTemplate>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: updatedData.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) throw error;

      setToast({ message: '项目更新成功', type: 'success' });
      await refreshProjects();
    } catch (error) {
      console.error('更新项目失败:', error);
      throw new Error(error instanceof Error ? error.message : '更新失败');
    }
  };

  const handleBatchDownload = async (project: ProjectWithTemplate) => {
    if (!project.generation?.preview_images || project.generation.preview_images.length === 0) {
      setToast({ message: '该项目暂无可下载的图片', type: 'error' });
      return;
    }

    try {
      setToast({ message: '开始准备下载...', type: 'success' });
      
      const images = project.generation.preview_images;
      const projectName = project.name || '婚纱照';
      
      // 创建一个临时的下载链接
      const downloadPromises = images.map(async (imageUrl, index) => {
        try {
          if (imageUrl.startsWith('data:')) {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${projectName}_${index + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            return true;
          } else {
            // 跨域场景下直接打开新标签，避免 CORS 受限
            const a = document.createElement('a');
            a.href = imageUrl;
            a.target = '_blank';
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return true;
          }
        } catch (error) {
          console.error(`下载第 ${index + 1} 张图片失败:`, error);
          return false;
        }
      });

      const results = await Promise.all(downloadPromises);
      const successCount = results.filter(Boolean).length;
      const totalCount = images.length;

      if (successCount === totalCount) {
        setToast({ message: `成功下载 ${successCount} 张图片`, type: 'success' });
      } else {
        setToast({ 
          message: `下载完成：${successCount}/${totalCount} 张图片成功`, 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('批量下载失败:', error);
      setToast({ message: '批量下载失败，请重试', type: 'error' });
    }
  };

  const handleToggleGalleryShare = async (generationId: string, isShared: boolean) => {
    if (!user) {
      setToast({ message: '请先登录', type: 'error' });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setToast({ message: '认证失败，请重新登录', type: 'error' });
        return;
      }

      const response = await fetch(`/api/generations/${generationId}/share`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ isShared }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '更新分享状态失败');
      }

      const result = await response.json();
      setToast({ message: result.message, type: 'success' });
      await refreshProjects();
    } catch (error) {
      console.error('切换分享状态失败:', error);
      setToast({
        message: error instanceof Error ? error.message : '操作失败，请重试',
        type: 'error',
      });
    }
  };

  const handleRegenerateProject = async (project: ProjectWithTemplate) => {
    if (!project.template) {
      setToast({ message: '无法重新生成：缺少模板信息', type: 'error' });
      return;
    }

    if (!profile) {
      setToast({ message: '请先登录后再重新生成', type: 'error' });
      return;
    }

    try {
      setToast({ message: '开始重新生成...', type: 'success' });
      
      // 获取完整的模板信息以获取价格
      const { data: fullTemplate, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', project.template.id)
        .single();

      if (templateError || !fullTemplate) {
        throw new Error('无法获取模板信息');
      }

      // 检查积分是否足够
      if (profile.credits < fullTemplate.price_credits) {
        setToast({ message: '积分不足，请先购买积分', type: 'error' });
        return;
      }
      
      // 这里需要创建一个新的 generation 记录
      const { data: newGeneration, error } = await supabase
        .from('generations')
        .insert({
          project_id: project.id,
          user_id: profile.id,
          template_id: project.template.id,
          status: 'pending',
          preview_images: [],
          high_res_images: [],
          credits_used: fullTemplate.price_credits,
        })
        .select()
        .single();

      if (error) throw error;

      // 扣除积分
      const { error: creditError } = await supabase
        .from('profiles')
        .update({
          credits: profile.credits - fullTemplate.price_credits,
        })
        .eq('id', profile.id);

      if (creditError) throw creditError;

      setToast({ message: '重新生成已开始，请稍候查看结果', type: 'success' });
      await Promise.all([refreshProjects(), refreshProfile()]);
      
      // 可以选择跳转到结果页面
      if (newGeneration?.id) {
        setTimeout(() => {
          onNavigate('results', undefined, newGeneration.id);
        }, 2000);
      }
    } catch (error) {
      console.error('重新生成失败:', error);
      setToast({ 
        message: error instanceof Error ? error.message : '重新生成失败，请重试', 
        type: 'error' 
      });
    }
  };

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
    <div className="min-h-screen bg-gradient-to-b from-champagne to-ivory py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn delay={0.1}>
          <div className="mb-8 space-y-6">
            <div>
              <h1 className="text-3xl font-display font-medium text-navy mb-2">欢迎回来，{profile?.full_name || '亲'}！</h1>
              <p className="text-stone">管理您的婚纱照项目和生成作品</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Sparkles} label="剩余积分" value={profile?.credits || 0} color="rose-gold" />
              <StatCard icon={Heart} label="累计收藏" value={likes} color="dusty-rose" />
              <StatCard icon={Download} label="累计下载" value={downloads} color="navy" />
              <StatCard icon={CheckCircle} label="完成项目" value={projects.filter(p => p.generation?.status === 'completed').length} color="forest" />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => onNavigate('pricing')}
                className="px-6 py-3 bg-gradient-to-r from-rose-gold to-dusty-rose text-ivory rounded-lg hover:shadow-glow transition-all duration-300 font-medium shadow-md"
                aria-label="前往价格页面购买积分"
              >
                购买更多积分
              </button>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-display font-medium text-navy">我的项目</h2>
              </div>
              <p className="text-stone mt-1">
                {projects.length} 个项目总计
                {filteredProjects.length < projects.length && (
                  <span className="text-dusty-rose"> • {filteredProjects.length} 个匹配筛选条件</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="px-4 py-3 bg-champagne text-navy rounded-md hover:bg-ivory transition-all duration-300 font-medium flex items-center gap-2 border border-stone/20 disabled:opacity-50"
                title="刷新项目列表"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
              <button
                onClick={() => onNavigate('templates')}
                className="px-6 py-3 bg-gradient-to-r from-rose-gold to-dusty-rose text-ivory rounded-md hover:shadow-glow transition-all duration-300 font-medium shadow-md flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                创建新项目
              </button>
            </div>
          </div>
        </FadeIn>

        {/* 搜索和筛选 */}
        <ProjectFilters
          filters={filters}
          onFiltersChange={setFilters}
          templateNames={templateNames}
        />

        <FadeIn delay={0.3}>
          <GlassCard className="mb-6">
            <div className="flex border-b border-stone/10">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab.id
                      ? 'border-dusty-rose text-dusty-rose'
                      : 'border-transparent text-stone hover:text-navy'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs bg-champagne rounded-full">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-dusty-rose animate-spin" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-champagne rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-10 h-10 text-stone" />
                </div>
                <h3 className="text-xl font-display font-medium text-navy mb-2">还没有项目</h3>
                <p className="text-stone mb-6">开始用AI创作惊艳的婚纱照</p>
                <button
                  onClick={() => onNavigate('templates')}
                  className="px-6 py-3 bg-gradient-to-r from-rose-gold to-dusty-rose text-ivory rounded-md hover:shadow-glow transition-all duration-300 font-medium inline-flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  创建您的第一个项目
                </button>
              </div>
            ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} aspectClass="aspect-video" lines={2} showBadge />
              ))}
            </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {filteredProjects.map(project => {
                  // 判断是否有生成结果图片
                  const hasGeneratedImages = project.generation?.status === 'completed' &&
                    project.generation?.preview_images &&
                    project.generation.preview_images.length > 0;

                  // 调试信息
                  console.log('项目调试信息:', {
                    projectId: project.id,
                    projectName: project.name,
                    generationStatus: project.generation?.status,
                    previewImagesCount: project.generation?.preview_images?.length || 0,
                    hasGeneratedImages
                  });

                  // 优先显示生成结果，其次模板预览，最后上传照片
                  const displayImage = hasGeneratedImages
                    ? project.generation!.preview_images[0]
                    : (project.template?.preview_image_url || project.uploaded_photos[0] || 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=400');

                  return (
                  <div
                    key={project.id}
                    className="bg-ivory rounded-xl overflow-hidden shadow-md border border-stone/10 hover:shadow-xl hover:border-dusty-rose/30 transition-all duration-500 group cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {/* 主显示图片 */}
                      <Image
                        src={displayImage}
                        alt={project.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />

                      {/* 渐变遮罩 */}
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent" />

                      {/* 顶部状态栏 */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-ivory/95 backdrop-blur-sm rounded-full shadow-sm">
                          {renderStatus(project.generation?.status || project.status)}
                        </div>

                        <div className="bg-ivory/95 backdrop-blur-sm rounded-md shadow-sm">
                        <ProjectActionsMenu
                          projectId={project.id}
                          projectName={project.name}
                          status={project.generation?.status || project.status}
                          isSharedToGallery={project.generation?.is_shared_to_gallery}
                          onView={() => project.generation?.id && onNavigate('results', undefined, project.generation.id)}
                          onEdit={() => {
                            setEditingProject(project);
                          }}
                          onDelete={() => {
                            setDeleteConfirm({ id: project.id, name: project.name });
                          }}
                          onRegenerate={() => {
                            handleRegenerateProject(project);
                          }}
                          onShare={() => {
                            if (project.generation?.id) {
                              const url = `${window.location.origin}/results/${project.generation.id}`;
                              navigator.clipboard.writeText(url).then(() => {
                                setToast({ message: '分享链接已复制到剪贴板', type: 'success' });
                              }).catch(() => {
                                setToast({ message: '复制失败，请重试', type: 'error' });
                              });
                            }
                          }}
                          onDownload={() => {
                            handleBatchDownload(project);
                          }}
                          onToggleGalleryShare={(isShared) => {
                            if (project.generation?.id) {
                              handleToggleGalleryShare(project.generation.id, isShared);
                            }
                          }}
                        />
                      </div>
                    </div>

                      {/* 已完成的生成结果 - 显示缩略图网格 */}
                      {hasGeneratedImages && project.generation!.preview_images.length > 1 && (
                        <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {project.generation!.preview_images.slice(0, 4).map((img, idx) => (
                            <div key={idx} className="relative w-14 h-14 rounded-md overflow-hidden border-2 border-ivory shadow-lg flex-shrink-0">
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
                            <div className="w-14 h-14 rounded-md bg-navy/80 backdrop-blur-sm border-2 border-ivory shadow-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-ivory text-xs font-medium">
                                +{project.generation!.preview_images.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 已完成但只有1张图 - 显示查看按钮 */}
                      {hasGeneratedImages && project.generation!.preview_images.length === 1 && (
                        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button className="w-full px-4 py-2.5 bg-ivory text-navy rounded-lg hover:bg-champagne transition-all duration-300 font-medium flex items-center justify-center gap-2 shadow-lg">
                            查看结果
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* 未完成 - 显示进度提示 */}
                      {!hasGeneratedImages && project.generation?.status !== 'failed' && (
                        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                        <h3 className="text-lg font-display font-medium text-navy mb-1 group-hover:text-dusty-rose transition-colors line-clamp-1">
                          {project.name}
                        </h3>
                        <p className="text-sm text-stone line-clamp-1">
                          模板：{project.template?.name || '未选择'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-sm pt-2 border-t border-stone/10">
                        <div className="flex items-center gap-3">
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
                })}
              </div>
            )}

            {/* 统计图表 */}
            {projects.length > 0 && (
              <div className="mt-12 px-6 pb-6">
                <h3 className="text-xl font-display font-medium text-navy mb-6">数据统计</h3>
                <ProjectStatsChart projects={projects} />
              </div>
            )}

            <div className="m-6 bg-gradient-to-br from-champagne to-blush rounded-md p-8 border border-rose-gold/20">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-gold to-dusty-rose rounded-md flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Sparkles className="w-8 h-8 text-ivory" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-display font-medium text-navy mb-2">需要更多积分？</h3>
                  <p className="text-stone">
                    Get more generations with our affordable credit packages. Perfect for creating unlimited variations.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="px-6 py-3 bg-gradient-to-r from-rose-gold to-dusty-rose text-ivory rounded-md hover:shadow-glow transition-all duration-300 font-medium shadow-md whitespace-nowrap"
                >
                  查看价格
                </button>
              </div>
            </div>
          </GlassCard>
        </FadeIn>
      </div>

      {/* 删除确认对话框 */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          title="删除项目"
          message={`确定要删除项目"${deleteConfirm.name}"吗？此操作不可撤销，将同时删除所有相关的生成记录。`}
          confirmText="删除"
          cancelText="取消"
          variant="danger"
          onConfirm={() => handleDeleteProject(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* 项目详情模态框 */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          onView={() => {
            if (selectedProject.generation?.id) {
              onNavigate('results', undefined, selectedProject.generation.id);
              setSelectedProject(null);
            }
          }}
          onEdit={() => {
            setEditingProject(selectedProject);
            setSelectedProject(null);
          }}
          onRegenerate={() => {
            handleRegenerateProject(selectedProject);
            setSelectedProject(null);
          }}
          onShare={() => {
            if (selectedProject.generation?.id) {
              const url = `${window.location.origin}/results/${selectedProject.generation.id}`;
              navigator.clipboard.writeText(url).then(() => {
                setToast({ message: '分享链接已复制到剪贴板', type: 'success' });
              });
            }
            setSelectedProject(null);
          }}
          onDownload={() => {
            handleBatchDownload(selectedProject);
            setSelectedProject(null);
          }}
        />
      )}

      {/* 项目编辑模态框 */}
      {editingProject && (
        <ProjectEditModal
          project={editingProject}
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          onSave={async (updatedData) => {
            await handleUpdateProject(editingProject.id, updatedData);
            setEditingProject(null);
          }}
        />
      )}

      {/* Toast 通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
