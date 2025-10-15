"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Edit, Trash2, Eye, EyeOff, Copy } from 'lucide-react';
import type { Template } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (templateId: string, skipConfirm?: boolean) => {
    if (!skipConfirm) {
      // 若未通过弹窗确认，则进行浏览器确认（兜底）
      if (!confirm('确定要删除此模板吗？')) return;
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

  // 复制模板：创建一份副本并跳转到编辑页
  const duplicateTemplate = async (template: Template) => {
    try {
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
        body: JSON.stringify({
          name: `${template.name}（副本）`,
          description: template.description || '',
          category: template.category,
          preview_image_url: template.preview_image_url,
          prompt_config: template.prompt_config || {},
          prompt_list: template.prompt_list || [],
          price_credits: template.price_credits,
          is_active: false,
          sort_order: template.sort_order,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || '复制模板失败');
      }

      const data = await response.json();
      const newId = data?.template?.id;
      if (newId) {
        router.push(`/admin/templates/${newId}`);
      } else {
        await loadTemplates();
      }
    } catch (err) {
      console.error('复制模板出错:', err);
      alert(err instanceof Error ? err.message : '复制模板失败');
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
      <div className="p-4 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">模板管理</h1>
            <p className="text-muted-foreground mt-1.5">管理 AI 生成模板</p>
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
          <div className="py-16 text-center">
            <div className="mx-auto max-w-md space-y-4">
              <h3 className="text-xl font-semibold">还没有模板</h3>
              <p className="text-muted-foreground">创建你的第一个模板，用于 AI 生成与演示。</p>
              <div className="pt-2">
                <Link href="/admin/templates/new">
                  <Button className="px-6">
                    <Plus className="mr-2 w-4 h-4" />
                    创建模板
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                role="button"
                tabIndex={0}
                aria-label={`编辑模板：${template.name}`}
                onClick={() => router.push(`/admin/templates/${template.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/admin/templates/${template.id}`);
                  }
                }}
                className={cn(
                  'group relative flex flex-col gap-5 items-start p-5 h-full rounded-xl border bg-card shadow-sm transition-colors transition-shadow transition-transform duration-300 sm:flex-row hover:shadow-md hover:bg-muted/50 md:hover:-translate-y-0.5 hover:border-primary/30 focus:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-pointer',
                  !template.is_active && 'opacity-80'
                )}
              >
                {!template.is_active && (
                  <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                    未启用
                  </span>
                )}
                <div className="overflow-hidden relative w-full h-40 rounded sm:w-36 sm:h-24 sm:flex-shrink-0">
                  <Image
                    src={template.preview_image_url}
                    alt={template.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="flex-1">
                  <div className="flex gap-4 justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{template.name}</h3>
                        <span
                          className={
                            "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium " +
                            (template.is_active
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300"
                              : "bg-muted text-muted-foreground border")
                          }
                        >
                          {template.is_active ? "启用中" : "未启用"}
                        </span>
                      </div>
                      <p
                        id={`desc-${template.id}`}
                        className="text-sm leading-relaxed text-muted-foreground"
                      >
                        {expanded[template.id]
                          ? template.description
                          : (template.description?.length ?? 0) > 120
                          ? `${template.description?.slice(0, 120)}…`
                          : template.description}
                        {(template.description?.length ?? 0) > 120 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(template.id)}
                            className="ml-2 text-xs text-primary underline underline-offset-4 hover:opacity-90"
                            aria-expanded={!!expanded[template.id]}
                            aria-controls={`desc-${template.id}`}
                          >
                            {expanded[template.id] ? "收起" : "展开"}
                          </button>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-3 items-center mt-2 text-xs text-muted-foreground">
                        <span>{CATEGORY_LABELS[template.category] ?? template.category}</span>
                        <span>{template.price_credits} 积分</span>
                        <span>排序：{template.sort_order}</span>
                        <span>提示词：{getPromptCount(template)}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 items-center mt-3 sm:mt-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); duplicateTemplate(template); }}
                        title="复制"
                        aria-label="复制模板"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); toggleActive(template); }}
                        title={template.is_active ? '停用' : '启用'}
                        aria-label={template.is_active ? '停用模板' : '启用模板'}
                        aria-pressed={template.is_active}
                      >
                        {template.is_active ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>

                      <Link href={`/admin/templates/${template.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="编辑"
                          aria-label={`编辑模板：${template.name}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="删除"
                            aria-label="删除模板"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>删除模板</AlertDialogTitle>
                            <AlertDialogDescription>
                              此操作不可恢复，确定删除“{template.name}”吗？
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>取消</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(template.id, true);
                              }}
                            >
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
