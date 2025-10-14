import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 说明：
// - 该中间件为“可选启用”的服务端登录保护示例。
// - 仅当设置环境变量 ENABLE_SSR_GUARD="true" 时才生效。
// - 默认通过检测 Supabase Auth Helpers 设置的 cookie（sb-access-token）判断登录态。
// - 本仓库当前使用客户端 supabase-js（localStorage 会话），若未接入 Helpers，则该中间件不会启用（除非你显式开启）。

export function middleware(req: NextRequest) {
  // 未开启则直接放行
  if (process.env.ENABLE_SSR_GUARD !== 'true') {
    return NextResponse.next();
  }

  const accessToken =
    req.cookies.get('sb-access-token')?.value ||
    req.cookies.get('supabase-auth-token')?.value ||
    req.cookies.get('sb:token')?.value;

  // 未检测到登录 cookie，重定向到首页并带回跳路径参数
  if (!accessToken) {
    const redirectUrl = new URL('/', req.url);
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// 仅拦截需要保护的页面
export const config = {
  matcher: ['/dashboard', '/results/:path*', '/create'],
};

