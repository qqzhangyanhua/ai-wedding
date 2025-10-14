"use client";

import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { TemplateForm } from '@/components/admin/TemplateForm';
import type { TemplateFormInput } from '@/types/admin';
import { supabase } from '@/lib/supabase';

export default function NewTemplatePage() {
  const router = useRouter();

  const handleSubmit = async (data: TemplateFormInput) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push('/');
      return;
    }

    const response = await fetch('/api/admin/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '创建模板失败');
    }

    router.push('/admin/templates');
  };

  const handleCancel = () => {
    router.push('/admin/templates');
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">创建新模板</h1>
          <p className="text-muted-foreground">在平台中添加新的 AI 生成模板</p>
        </div>

        <TemplateForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </AdminLayout>
  );
}
