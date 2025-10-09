"use client";

import { AuthProvider } from '../src/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  // 将客户端上下文放在 Next App Router 的根部
  return <AuthProvider>{children}</AuthProvider>;
}

