"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import type { Template } from '@/types/database';
import { supabase } from '@/lib/supabase';

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
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
        if (response.status === 403) {
          setError('访问被拒绝，需要管理员权限。');
          return;
        }
        throw new Error('加载模板失败');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('加载模板出错:', err);
      setError(err instanceof Error ? err.message : '加载模板失败');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleDelete = async (templateId: string) => {
    if (!confirm('确定要删除此模板吗？')) {
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('删除模板失败');
      }

      await loadTemplates();
    } catch (err) {
      console.error('删除出错:', err);
      alert(err instanceof Error ? err.message : '删除模板失败');
    }
  };

  const toggleActive = async (template: Template) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_active: !template.is_active }),
      });

      if (!response.ok) {
        throw new Error('更新模板失败');
      }

      await loadTemplates();
    } catch (err) {
      console.error('切换启用状态出错:', err);
      alert(err instanceof Error ? err.message : '更新模板失败');
    }
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

  // 分类中文标签映射，仅影响展示
  const CATEGORY_LABELS: Record<string, string> = {
    location: '地点',
    fantasy: '奇幻',
    artistic: '艺术',
    classic: '经典',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">模板管理</h1>
            <p className="text-muted-foreground">管理 AI 生成模板</p>
          </div>
          <Link href="/admin/templates/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建模板
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">加载中...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">暂无模板，创建你的第一个模板吧。</div>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded">
                  <Image
                    src={template.preview_image_url}
                    alt={template.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                      <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{CATEGORY_LABELS[template.category] ?? template.category}</span>
                        <span>{template.price_credits} 积分</span>
                        <span>排序：{template.sort_order}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(template)}
                        title={template.is_active ? '停用' : '启用'}
                      >
                        {template.is_active ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>

                      <Link href={`/admin/templates/${template.id}`}>
                        <Button variant="ghost" size="icon" title="编辑">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id)}
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
