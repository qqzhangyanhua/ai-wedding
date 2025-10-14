"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { TemplateForm } from '@/components/admin/TemplateForm';
import type { Template } from '@/types/database';
import type { TemplateFormInput } from '@/types/admin';
import { supabase } from '@/lib/supabase';

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplate = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/admin/templates', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('加载模板失败');
      }

      const data = await response.json();
      const foundTemplate = data.templates.find((t: Template) => t.id === templateId);

      if (!foundTemplate) {
        setError('未找到模板');
        return;
      }

      setTemplate(foundTemplate);
    } catch (err) {
      console.error('加载模板出错:', err);
      setError(err instanceof Error ? err.message : '加载模板失败');
    } finally {
      setIsLoading(false);
    }
  }, [router, templateId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const handleSubmit = async (data: TemplateFormInput) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push('/');
      return;
    }

    const response = await fetch(`/api/admin/templates/${templateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '更新模板失败');
    }

    router.push('/admin/templates');
  };

  const handleCancel = () => {
    router.push('/admin/templates');
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">加载中...</div>
      </AdminLayout>
    );
  }

  if (!template) {
    return (
      <AdminLayout>
        <div className="text-center py-12 text-muted-foreground">
          未找到模板
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">编辑模板</h1>
          <p className="text-muted-foreground">更新模板：{template.name}</p>
        </div>

        <TemplateForm
          template={template}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </AdminLayout>
  );
}
