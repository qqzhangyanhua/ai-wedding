"use client";

import { useRouter } from 'next/navigation';
import { PricingPage } from '../../src/views/PricingPage';

export default function Page() {
  const router = useRouter();

  const onNavigate = (page: string) => {
    switch (page) {
      case 'templates':
        router.push('/templates');
        break;
      case 'dashboard':
        router.push('/dashboard');
        break;
      default:
        router.push('/');
    }
  };

  return <PricingPage onNavigate={onNavigate} />;
}
