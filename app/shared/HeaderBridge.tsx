"use client";

import { usePathname, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';

// 将 Next 的路由与现有 Header 的 onNavigate/currentPage 契约做桥接
export default function HeaderBridge() {
  const router = useRouter();
  const pathname = usePathname();

  const onNavigate = (page: string, _template?: unknown, generationId?: string) => {
    switch (page) {
      case 'home':
        router.push('/');
        break;
      case 'templates':
        router.push('/templates');
        break;
      case 'gallery':
        router.push('/gallery');
        break;
      case 'create':
        router.push('/create');
        break;
      case 'pricing':
        router.push('/pricing');
        break;
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'results':
        if (generationId) router.push(`/results/${generationId}`);
        break;
      default:
        router.push('/');
    }
  };

  const currentPage = (() => {
    if (pathname === '/') return 'home';
    if (pathname?.startsWith('/templates')) return 'templates';
    if (pathname?.startsWith('/gallery')) return 'gallery';
    if (pathname?.startsWith('/create')) return 'create';
    if (pathname?.startsWith('/pricing')) return 'pricing';
    if (pathname?.startsWith('/dashboard')) return 'dashboard';
    if (pathname?.startsWith('/results')) return 'results';
    if (pathname?.startsWith('/testimonials')) return 'testimonials';
    return 'home';
  })();

  return <Header onNavigate={onNavigate} currentPage={currentPage} />;
}
