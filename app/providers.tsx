"use client";

import { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  // 捕获 URL 中的邀请参数 ?inv=CODE 并存入本地，供注册时使用
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const inv = url.searchParams.get('inv');
      if (inv) {
        localStorage.setItem('referrer_code', inv);
      }
    } catch {}
  }, []);

  // 将客户端上下文放在 Next App Router 的根部
  return <AuthProvider>{children}</AuthProvider>;
}
