import { useState, useMemo, useCallback } from 'react';
import { Plus, RefreshCw, Sparkles } from 'lucide-react';
import { Template, ProjectWithTemplate, SingleGeneration } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useSingleGenerations } from '@/hooks/useSingleGenerations';
import { useEngagementStats } from '@/hooks/useEngagementStats';
import { ProjectFilters } from './ProjectFilters';
import type { FilterState } from '@/types/filters';
import { ProjectStatsChart } from './ProjectStatsChart';
import { FadeIn, GlassCard } from '@/components/react-bits';
import { ConfirmDialog } from './ConfirmDialog';
import { Toast } from './Toast';
import { ProjectDetailModal } from './ProjectDetailModal';
import { ProjectEditModal } from './ProjectEditModal';
import { SingleGenerationDetailModal } from './SingleGenerationDetailModal';
import { supabase } from '@/lib/supabase';
import {
  DashboardHeader,
  DashboardTabs,
  SingleGenerationList,
  ProjectList,
} from './Dashboard';

interface DashboardPageProps {
  onNavigate: (page: string, template?: Template, generationId?: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { profile, user } = useAuth();
  const { projects, loading, refreshProjects } = useProjects();
  const {
    generations,
    loading: singleLoading,
    refreshGenerations,
    deleteGeneration,
  } = useSingleGenerations();
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'single'>('all');
  const { likes, downloads } = useEngagementStats();
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: 'all',
    dateRange: 'all',
    templateName: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(
    null
  );
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );
  const [selectedProject, setSelectedProject] = useState<ProjectWithTemplate | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectWithTemplate | null>(null);
  const [selectedSingleGeneration, setSelectedSingleGeneration] =
    useState<SingleGeneration | null>(null);

  // 手动刷新项目列表
  const handleManualRefresh = async () => {
    if (activeTab === 'single') {
      await refreshGenerations();
    } else {
      await refreshProjects();
    }
    setToast({ message: '列表已刷新', type: 'success' });
  };

  // 项目标签页配置
  const tabs = useMemo(
    () => [
      { id: 'all', label: '所有项目', count: projects.length },
      {
        id: 'completed',
        label: '已完成',
        count: projects.filter(p => p.generation?.status === 'completed').length,
      },
      { id: 'single', label: '单张生成', count: generations.length },
    ],
    [projects, generations]
  );

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
      if (activeTab === 'completed' && project.generation?.status !== 'completed')
        return false;
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = project.name.toLowerCase().includes(query);
        const matchTemplate = project.template?.name?.toLowerCase().includes(query);
        if (!matchName && !matchTemplate) return false;
      }
      if (filters.status !== 'all' && project.generation?.status !== filters.status) {
        return false;
      }
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const createdAt = new Date(project.created_at);
        const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (filters.dateRange === 'today' && diffDays > 1) return false;
        if (filters.dateRange === 'week' && diffDays > 7) return false;
        if (filters.dateRange === 'month' && diffDays > 30) return false;
      }
      if (filters.templateName && project.template?.name !== filters.templateName) {
        return false;
      }
      return true;
    });
  }, [projects, activeTab, filters]);

  const getTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return '刚刚';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}天前`;
    return `${Math.floor(seconds / 604800)}周前`;
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
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

  const handleUpdateProject = async (
    projectId: string,
    updatedData: Partial<ProjectWithTemplate>
  ) => {
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

  const handleDeleteSingleGeneration = async (id: string) => {
    try {
      await deleteGeneration(id);
      setToast({ message: '记录已删除', type: 'success' });
    } catch (error) {
      console.error('删除单张生成记录失败:', error);
      setToast({ message: '删除失败，请重试', type: 'error' });
    }
  };

  const handleBatchDownload = async (project: ProjectWithTemplate) => {
    if (
      !project.generation?.preview_images ||
      project.generation.preview_images.length === 0
    ) {
      setToast({ message: '该项目暂无可下载的图片', type: 'error' });
      return;
    }

    try {
      setToast({ message: '开始准备下载...', type: 'success' });
      const images = project.generation.preview_images;
      const projectName = project.name || '婚纱照';

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
          type: 'error',
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setToast({ message: '认证失败，请重新登录', type: 'error' });
        return;
      }

      const response = await fetch(`/api/generations/${generationId}/share`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
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

  return (
    <div className="py-12 min-h-screen bg-gradient-to-b from-champagne to-ivory">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <DashboardHeader
          profile={profile}
          projects={projects}
          likes={likes}
          downloads={downloads}
          onNavigateToPricing={() => onNavigate('pricing')}
        />

        <FadeIn delay={0.2}>
          <div className="flex flex-col gap-4 justify-between items-start mb-8 sm:flex-row sm:items-center">
            <div>
              <div className="flex gap-3 items-center">
                <h2 className="text-2xl font-medium font-display text-navy">我的项目</h2>
              </div>
              <p className="mt-1 text-stone">
                {projects.length} 个项目总计
                {filteredProjects.length < projects.length && (
                  <span className="text-dusty-rose">
                    {' '}
                    • {filteredProjects.length} 个匹配筛选条件
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-3 items-center">
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="flex gap-2 items-center px-4 py-3 font-medium rounded-md border transition-all duration-300 bg-champagne text-navy hover:bg-ivory border-stone/20 disabled:opacity-50"
                title="刷新项目列表"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
              <button
                onClick={() => onNavigate('templates')}
                className="flex gap-2 items-center px-6 py-3 font-medium bg-gradient-to-r rounded-md shadow-md transition-all duration-300 from-rose-gold to-dusty-rose text-ivory hover:shadow-glow"
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
            <DashboardTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={id => setActiveTab(id as typeof activeTab)}
            />

            {/* 单张生成标签页 */}
            {activeTab === 'single' ? (
              <SingleGenerationList
                generations={generations}
                loading={singleLoading}
                onDelete={handleDeleteSingleGeneration}
                onView={setSelectedSingleGeneration}
                onNavigateToGenerateSingle={() => onNavigate('generate-single')}
              />
            ) : (
              /* 项目列表标签页 */
              <ProjectList
                projects={filteredProjects}
                loading={loading}
                onProjectClick={setSelectedProject}
                onView={project => {
                  if (project.generation?.id) {
                    onNavigate('results', undefined, project.generation.id);
                  }
                }}
                onEdit={setEditingProject}
                onDelete={project =>
                  setDeleteConfirm({ id: project.id, name: project.name })
                }
                onShare={project => {
                  if (project.generation?.id) {
                    const url = `${window.location.origin}/results/${project.generation.id}`;
                    navigator.clipboard
                      .writeText(url)
                      .then(() => {
                        setToast({ message: '分享链接已复制到剪贴板', type: 'success' });
                      })
                      .catch(() => {
                        setToast({ message: '复制失败，请重试', type: 'error' });
                      });
                  }
                }}
                onDownload={handleBatchDownload}
                onToggleGalleryShare={handleToggleGalleryShare}
                onNavigateToTemplates={() => onNavigate('templates')}
                getTimeAgo={getTimeAgo}
              />
            )}

            {/* 统计图表 */}
            {projects.length > 0 && activeTab !== 'single' && (
              <div className="px-6 pb-6 mt-12">
                <h3 className="mb-6 text-xl font-medium font-display text-navy">数据统计</h3>
                <ProjectStatsChart projects={projects} />
              </div>
            )}

            <div className="p-8 m-6 bg-gradient-to-br rounded-md border from-champagne to-blush border-rose-gold/20">
              <div className="flex flex-col gap-6 items-center md:flex-row">
                <div className="flex flex-shrink-0 justify-center items-center w-16 h-16 bg-gradient-to-br rounded-md shadow-sm from-rose-gold to-dusty-rose">
                  <Sparkles className="w-8 h-8 text-ivory" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="mb-2 text-xl font-medium font-display text-navy">
                    需要更多积分？
                  </h3>
                  <p className="text-stone">
                    Get more generations with our affordable credit packages. Perfect for
                    creating unlimited variations.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="px-6 py-3 font-medium whitespace-nowrap bg-gradient-to-r rounded-md shadow-md transition-all duration-300 from-rose-gold to-dusty-rose text-ivory hover:shadow-glow"
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
          onSave={async updatedData => {
            await handleUpdateProject(editingProject.id, updatedData);
            setEditingProject(null);
          }}
        />
      )}

      {/* 单张生成详情模态框 */}
      {selectedSingleGeneration && (
        <SingleGenerationDetailModal
          generation={selectedSingleGeneration}
          isOpen={!!selectedSingleGeneration}
          onClose={() => setSelectedSingleGeneration(null)}
        />
      )}

      {/* Toast 通知 */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
