"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn } from 'lucide-react';
import { DashboardPage } from '@/components/DashboardPage';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';

// 仪表盘路由保护：未登录用户将看到登录引导
export default function Page() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  // 统一页面内导航
  const onNavigate = (page: string, _t?: unknown, generationId?: string) => {
    switch (page) {
      case 'templates':
        router.push('/templates');
        break;
      case 'pricing':
        router.push('/pricing');
        break;
      case 'results':
        if (generationId) router.push(`/results/${generationId}`);
        break;
      default:
        router.push('/');
    }
  };

  // 加载中：展示轻量占位
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-champagne to-ivory">
        <div className="flex items-center gap-3 text-stone">
          <span className="w-3 h-3 rounded-full bg-dusty-rose animate-pulse" />
          <span>正在加载账户信息...</span>
        </div>
      </div>
    );
  }

  // 未登录：引导用户登录/注册
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-champagne to-ivory flex items-center">
        <div className="max-w-3xl mx-auto px-6 w-full">
          <div className="bg-ivory border border-stone/10 rounded-2xl shadow-sm p-10 text-center">
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-champagne flex items-center justify-center">
              <Lock className="w-8 h-8 text-dusty-rose" />
            </div>
            <h1 className="text-2xl font-display font-medium text-navy mb-2">需要登录才能访问仪表盘</h1>
            <p className="text-stone mb-8">请登录或创建账号后继续管理您的项目与生成结果。</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowAuth(true)}
                className="px-6 py-3 bg-navy text-ivory rounded-md hover:bg-navy/90 transition-all duration-200 shadow-sm hover:shadow-md font-medium inline-flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                登录 / 注册
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-champagne text-navy rounded-md border border-stone/20 hover:bg-ivory transition-all duration-200 font-medium"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  // 已登录：渲染仪表盘
  return <DashboardPage onNavigate={onNavigate} />;
}
