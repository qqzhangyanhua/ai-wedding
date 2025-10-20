"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function OAuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleExchange = async () => {
      try {
        const code = params?.get('code');
        const redirect = params?.get('redirect');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message || '登录回调处理失败');
            return;
          }
        } else {
          // 无 code 时尝试读取现有会话，容错处理
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            setError(sessionError.message || '未能获取登录会话');
            return;
          }
          if (!data.session) {
            setError('未检测到有效的登录会话');
            return;
          }
        }

        // 成功后跳转回原页面或默认页
        const next = redirect && redirect.startsWith('/') ? redirect : '/dashboard';
        router.replace(next);
      } catch (e: any) {
        setError(e?.message || '登录回调出现异常');
      }
    };

    handleExchange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-champagne to-ivory">
        <div className="p-8 bg-ivory border border-stone/20 rounded-xl shadow-sm text-center">
          <h1 className="text-2xl font-display font-medium text-navy mb-3">登录失败</h1>
          <p className="text-stone mb-6">{error}</p>
          <a href="/" className="px-6 py-3 bg-navy text-ivory rounded-md hover:bg-navy/90 transition-all">返回首页</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-champagne to-ivory">
      <div className="flex items-center gap-3 text-stone">
        <span className="w-3 h-3 rounded-full bg-dusty-rose animate-pulse" />
        <span>正在完成登录，请稍候...</span>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-champagne to-ivory">
      <div className="flex items-center gap-3 text-stone">
        <span className="w-3 h-3 rounded-full bg-dusty-rose animate-pulse" />
        <span>正在加载...</span>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OAuthCallbackContent />
    </Suspense>
  );
}

