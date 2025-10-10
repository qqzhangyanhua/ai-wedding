import { useState, useMemo } from 'react';
import { Camera, Clock, CheckCircle, AlertCircle, Plus, ArrowRight, Sparkles, Loader2, Heart, Download } from 'lucide-react';
import Image from 'next/image';
import { getStatusLabel, getStatusVisual } from '../lib/status';
import { Template } from '../types/database';
//
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useEngagementStats } from '../hooks/useEngagementStats';
import { ProjectFilters, FilterState } from '../components/ProjectFilters';
import { ProjectActionsMenu } from '../components/ProjectActionsMenu';
import { ProjectProgress } from '../components/ProjectProgress';
import { ProjectStatsChart } from '../components/ProjectStatsChart';
import { FadeIn, GlassCard } from '@/components/react-bits';
import { StatCard } from '../components/StatCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast } from '../components/Toast';
import { supabase } from '../lib/supabase';

interface DashboardPageProps {
  onNavigate: (page: string, template?: Template, generationId?: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { profile } = useAuth();
  const { projects, loading, refreshProjects } = useProjects();
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'processing'>('all');
  const { likes, downloads } = useEngagementStats();
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: 'all',
    dateRange: 'all',
    templateName: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 约束选项类型，避免类型断言
  const tabs: { id: typeof activeTab; label: string; count: number }[] = [
    { id: 'all', label: '所有项目', count: projects.length },
    { id: 'completed', label: '已完成', count: projects.filter(p => p.generation?.status === 'completed').length },
    { id: 'processing', label: '处理中', count: projects.filter(p => p.generation?.status === 'processing' || p.generation?.status === 'pending').length },
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
      if (activeTab === 'processing' && 
          !(project.generation?.status === 'processing' || project.generation?.status === 'pending')) return false;

      // 搜索关键词
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = project.name.toLowerCase().includes(query);
        const matchTemplate = project.template?.name?.toLowerCase().includes(query);
        if (!matchName && !matchTemplate) return false;
      }

      // 状态筛选
      if (filters.status !== 'all') {
        if (filters.status === 'processing') {
          if (!(project.generation?.status === 'processing' || project.generation?.status === 'pending')) return false;
        } else if (project.generation?.status !== filters.status) {
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

  const renderStatus = (status: string) => {
    const allowed = ['draft', 'processing', 'completed', 'failed', 'pending'] as const;
    type AllowedStatus = typeof allowed[number];
    const safeStatus: AllowedStatus = (allowed as readonly string[]).includes(status)
      ? (status as AllowedStatus)
      : 'draft';

    const { icon, colorClass, spin } = getStatusVisual(safeStatus);
    const label = getStatusLabel(safeStatus);
    const Icon = icon === 'check' ? CheckCircle : icon === 'clock' ? Clock : AlertCircle;
    return (
      <>
        <Icon className={`w-5 h-5 ${colorClass} ${spin ? 'animate-spin' : ''}`} />
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
              <h2 className="text-2xl font-display font-medium text-navy">我的项目</h2>
              <p className="text-stone mt-1">
                {projects.length} 个项目总计
                {filteredProjects.length < projects.length && (
                  <span className="text-dusty-rose"> • {filteredProjects.length} 个匹配筛选条件</span>
                )}
              </p>
            </div>

            <button
              onClick={() => onNavigate('templates')}
              className="px-6 py-3 bg-gradient-to-r from-rose-gold to-dusty-rose text-ivory rounded-md hover:shadow-glow transition-all duration-300 font-medium shadow-md flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              创建新项目
            </button>
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
                {filteredProjects.map(project => (
                  <div
                    key={project.id}
                    className="bg-ivory rounded-md overflow-hidden shadow-sm border border-stone/10 hover:shadow-lg transition-all duration-500 group cursor-pointer"
                    onClick={() => project.generation?.status === 'completed' && project.generation?.id && onNavigate('results', undefined, project.generation.id)}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={project.template?.preview_image_url || project.uploaded_photos[0] || 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=400'}
                        alt={project.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-ivory/95 backdrop-blur-sm rounded-full shadow-sm">
                          {renderStatus(project.generation?.status || project.status)}
                        </div>

                        <div className="bg-ivory/95 backdrop-blur-sm rounded-md shadow-sm">
                        <ProjectActionsMenu
                          projectId={project.id}
                          projectName={project.name}
                          status={project.generation?.status || project.status}
                          onView={() => project.generation?.id && onNavigate('results', undefined, project.generation.id)}
                          onEdit={() => {
                            // TODO: 实现编辑功能
                            setToast({ message: '编辑功能即将推出', type: 'error' });
                          }}
                          onDelete={() => {
                            setDeleteConfirm({ id: project.id, name: project.name });
                          }}
                          onRegenerate={() => {
                            // TODO: 实现重新生成功能
                            console.log('重新生成:', project.id);
                          }}
                          onShare={() => {
                            if (project.generation?.id) {
                              const url = `${window.location.origin}/results/${project.generation.id}`;
                              navigator.clipboard.writeText(url).then(() => {
                                alert('分享链接已复制到剪贴板');
                              });
                            }
                          }}
                          onDownload={() => {
                            // TODO: 实现批量下载功能
                            console.log('下载全部:', project.id);
                          }}
                        />
                      </div>
                    </div>

                      {project.generation?.status === 'completed' && (
                        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button className="w-full px-4 py-2.5 bg-ivory text-navy rounded-md hover:bg-champagne transition-all duration-300 font-medium flex items-center justify-center gap-2 shadow-lg">
                            查看结果
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-display font-medium text-navy mb-1 group-hover:text-dusty-rose transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-stone mb-4">模板：{project.template?.name || '未选择'}</p>

                    {/* 处理中项目显示进度条 */}
                    {(project.generation?.status === 'processing' || project.generation?.status === 'pending') && project.generation?.id && (
                      <div className="mb-4">
                        <ProjectProgress generationId={project.generation.id} />
                      </div>
                    )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          {project.generation?.status === 'completed' && project.generation?.preview_images && (
                            <div className="flex items-center gap-1 text-stone">
                              <Camera className="w-4 h-4" />
                              {project.generation.preview_images.length} 张照片
                            </div>
                          )}
                          {(project.generation?.status === 'processing' || project.generation?.status === 'pending') && (
                            <div className="flex items-center gap-2 text-dusty-rose">
                              <Clock className="w-4 h-4 animate-spin" />
                              进行中...
                            </div>
                          )}
                        </div>
                        <span className="text-stone/70">{getTimeAgo(project.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
