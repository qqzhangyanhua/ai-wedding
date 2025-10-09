"use client";

import { HomePage } from '../src/views/HomePage';
import { useRouter } from 'next/navigation';

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

  return <HomePage onNavigate={onNavigate} />;
}
