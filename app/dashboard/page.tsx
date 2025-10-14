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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-champagne to-ivory">
        <div className="flex gap-3 items-center text-stone">
          <span className="w-3 h-3 rounded-full animate-pulse bg-dusty-rose" />
          <span>正在加载账户信息...</span>
        </div>
      </div>
    );
  }

  // 未登录：引导用户登录/注册
  if (!user) {
    return (
      <div className="flex items-center min-h-screen bg-gradient-to-b from-champagne to-ivory">
        <div className="px-6 mx-auto w-full max-w-3xl">
          <div className="p-10 text-center rounded-2xl border shadow-sm bg-ivory border-stone/10">
            <div className="flex justify-center items-center mx-auto mb-6 w-16 h-16 rounded-full bg-champagne">
              <Lock className="w-8 h-8 text-dusty-rose" />
            </div>
            <h1 className="mb-2 text-2xl font-medium font-display text-navy">需要登录才能访问仪表盘</h1>
            <p className="mb-8 text-stone">请登录或创建账号后继续管理您的项目与生成结果。</p>
            <div className="flex gap-3 justify-center items-center">
              <button
                onClick={() => setShowAuth(true)}
                className="inline-flex gap-2 items-center px-6 py-3 font-medium rounded-md shadow-sm transition-all duration-200 bg-navy text-ivory hover:bg-navy/90 hover:shadow-md"
              >
                <LogIn className="w-4 h-4" />
                登录 / 注册
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 font-medium rounded-md border transition-all duration-200 bg-champagne text-navy border-stone/20 hover:bg-ivory"
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
