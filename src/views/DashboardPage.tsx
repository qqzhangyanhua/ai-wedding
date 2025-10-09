import { useState } from 'react';
import { Camera, Clock, CheckCircle, AlertCircle, Plus, ArrowRight, Sparkles, Loader2, Heart } from 'lucide-react';
import Image from 'next/image';
import { getStatusLabel, getStatusVisual } from '../lib/status';
import { Template } from '../types/database';
//
import { CardSkeleton } from '@/components/ui/card-skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useEngagementStats } from '../hooks/useEngagementStats';

interface DashboardPageProps {
  onNavigate: (page: string, template?: Template, generationId?: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { profile } = useAuth();
  const { projects, loading } = useProjects();
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'processing'>('all');
  const { likes, downloads } = useEngagementStats();

  // 约束选项类型，避免类型断言
  const tabs: { id: typeof activeTab; label: string; count: number }[] = [
    { id: 'all', label: '所有项目', count: projects.length },
    { id: 'completed', label: '已完成', count: projects.filter(p => p.generation?.status === 'completed').length },
    { id: 'processing', label: '处理中', count: projects.filter(p => p.generation?.status === 'processing' || p.generation?.status === 'pending').length },
  ];

  const filteredProjects = projects.filter(project => {
    if (activeTab === 'all') return true;
    if (activeTab === 'completed') return project.generation?.status === 'completed';
    if (activeTab === 'processing') return project.generation?.status === 'processing' || project.generation?.status === 'pending';
    return false;
  });

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
        <span className="text-sm font-medium text-gray-900">{label}</span>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">欢迎回来，{profile?.full_name || '亲'}！</h1>
              <p className="text-blue-100">管理您的婚纱照项目和生成作品</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="px-6 py-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  <div>
                    <div className="text-2xl font-bold">{profile?.credits || 0}</div>
                    <div className="text-sm text-blue-100">剩余积分</div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6" />
                  <div>
                    <div className="text-2xl font-bold">{likes}</div>
                    <div className="text-sm text-blue-100">累计收藏</div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="flex items-center gap-3">
                  <Camera className="w-6 h-6" />
                  <div>
                    <div className="text-2xl font-bold">{downloads}</div>
                    <div className="text-sm text-blue-100">累计下载</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('pricing')}
                className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-medium shadow-lg hover:shadow-xl"
              >
                购买更多积分
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">我的项目</h2>
            <p className="text-gray-600 mt-1">{projects.length} 个项目总计</p>
          </div>

          <button
            onClick={() => onNavigate('templates')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-xl hover:from-blue-700 hover:to-pink-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            创建新项目
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">还没有项目</h3>
              <p className="text-gray-600 mb-6">开始用AI创作惊艳的婚纱照</p>
              <button
                onClick={() => onNavigate('templates')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-xl hover:from-blue-700 hover:to-pink-700 transition-all font-medium inline-flex items-center gap-2"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-all group cursor-pointer"
                  onClick={() => project.generation?.status === 'completed' && project.generation?.id && onNavigate('results', undefined, project.generation.id)}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={project.template?.preview_image_url || project.uploaded_photos[0] || 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={project.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full">
                      {renderStatus(project.generation?.status || project.status)}
                    </div>

                    {project.generation?.status === 'completed' && (
                      <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-full px-4 py-2.5 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all font-medium flex items-center justify-center gap-2">
                          查看结果
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">模板：{project.template?.name || '未选择'}</p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {project.generation?.status === 'completed' && project.generation?.preview_images && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Camera className="w-4 h-4" />
                            {project.generation.preview_images.length} 张照片
                          </div>
                        )}
                        {(project.generation?.status === 'processing' || project.generation?.status === 'pending') && (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <Clock className="w-4 h-4 animate-spin" />
                            进行中...
                          </div>
                        )}
                      </div>
                      <span className="text-gray-500">{getTimeAgo(project.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 bg-gradient-to-br from-blue-50 to-pink-50 rounded-2xl p-8 border border-blue-100">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-gray-900 mb-2">需要更多积分？</h3>
                <p className="text-gray-600">
                  Get more generations with our affordable credit packages. Perfect for creating unlimited variations.
                </p>
              </div>
              <button
                onClick={() => onNavigate('pricing')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-xl hover:from-blue-700 hover:to-pink-700 transition-all font-medium shadow-md hover:shadow-lg whitespace-nowrap"
              >
                查看价格
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
