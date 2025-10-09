"use client";

import { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreatePage } from '../../src/views/CreatePage';
import { useTemplates } from '../../src/hooks/useTemplates';

function CreatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams?.get('templateId') || undefined;
  const { templates } = useTemplates();

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId]
  );

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

  return <CreatePage onNavigate={onNavigate} selectedTemplate={selectedTemplate} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-600">正在加载...</div>}>
      <CreatePageInner />
    </Suspense>
  );
}
