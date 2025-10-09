"use client";

import { useRouter } from 'next/navigation';
import { DashboardPage } from '../../src/views/DashboardPage';

export default function Page() {
  const router = useRouter();

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

  return <DashboardPage onNavigate={onNavigate} />;
}
