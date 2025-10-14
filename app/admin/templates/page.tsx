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

  // 计算提示词数量（仅展示用）
  const getPromptCount = (t: Template) => {
    const anyT = t as any;
    const list: string[] = Array.isArray(anyT?.prompt_list) ? anyT.prompt_list : [];
    if (list.length > 0) return list.length;
    if (t.prompt_config?.basePrompt && t.prompt_config.basePrompt.trim().length > 0) return 1;
    return 1;
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="p-4 text-red-800 bg-red-50 rounded-lg border border-red-200">
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">模板管理</h1>
            <p className="text-muted-foreground">管理 AI 生成模板</p>
          </div>
          <Link href="/admin/templates/new">
            <Button>
              <Plus className="mr-2 w-4 h-4" />
              新建模板
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">加载中...</div>
        ) : templates.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">暂无模板，创建你的第一个模板吧。</div>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex gap-4 items-center p-4 rounded-lg border"
              >
                <div className="overflow-hidden relative flex-shrink-0 w-32 h-20 rounded">
                  <Image
                    src={template.preview_image_url}
                    alt={template.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                      <div className="flex gap-4 items-center mt-1 text-xs text-muted-foreground">
                        <span>{CATEGORY_LABELS[template.category] ?? template.category}</span>
                        <span>{template.price_credits} 积分</span>
                        <span>排序：{template.sort_order}</span>
                        <span>提示词：{getPromptCount(template)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(template)}
                        title={template.is_active ? '停用' : '启用'}
                      >
                        {template.is_active ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>

                      <Link href={`/admin/templates/${template.id}`}>
                        <Button variant="ghost" size="icon" title="编辑">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id)}
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
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
