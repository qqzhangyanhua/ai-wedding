"use client";

import { TemplatesPage } from '../../src/views/TemplatesPage';
import { useRouter } from 'next/navigation';
import { Template } from '../../src/types/database';

export default function Page() {
  const router = useRouter();

  const onNavigate = (page: string, template?: Template) => {
    switch (page) {
      case 'create':
        if (template?.id) {
          router.push(`/create?templateId=${template.id}`);
        } else {
          router.push('/create');
        }
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

  return <TemplatesPage onNavigate={onNavigate} />;
}
