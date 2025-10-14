"use client";

import { useRouter } from 'next/navigation';
import { TestimonialsPage } from '@/components/TestimonialsPage';

export default function Page() {
  const router = useRouter();

  const onNavigate = (page: string) => {
    switch (page) {
      case 'templates':
        router.push('/templates');
        break;
      case 'pricing':
        router.push('/pricing');
        break;
      case 'dashboard':
        router.push('/dashboard');
        break;
      default:
        router.push('/');
    }
  };

  return <TestimonialsPage onNavigate={onNavigate} />;
}

