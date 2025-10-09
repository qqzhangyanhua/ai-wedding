"use client";

import { useRouter } from 'next/navigation';
import { ResultsPage } from '../../../src/views/ResultsPage';

export default function Page({ params }: { params: { id: string } }) {
  const router = useRouter();

  const onNavigate = (page: string) => {
    switch (page) {
      case 'dashboard':
        router.push('/dashboard');
        break;
      default:
        router.push('/');
    }
  };

  return <ResultsPage onNavigate={onNavigate} generationId={params.id} />;
}
