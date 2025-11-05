"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Megaphone, Save, Trash2, AlertCircle } from 'lucide-react';
import type { SystemAnnouncement } from '@/types/database';

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    id: '',
    content: '',
    is_active: false,
    published_at: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  });

  // 加载公告列表
  const loadAnnouncements = useCallback(async () => {
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

      const response = await fetch('/api/admin/announcements', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError('访问被拒绝，需要管理员权限。');
          return;
        }
        throw new Error('加载公告失败');
      }

      const data = await response.json();
      const fetchedAnnouncements = data.announcements || [];
      setAnnouncements(fetchedAnnouncements);

      // 如果有公告，加载最新的一条到表单
      if (fetchedAnnouncements.length > 0) {
        const latest = fetchedAnnouncements[0];
        setFormData({
          id: latest.id,
          content: latest.content,
          is_active: latest.is_active,
          published_at: new Date(latest.published_at).toISOString().split('T')[0],
        });
      }
    } catch (err) {
      console.error('加载公告出错:', err);
      setError(err instanceof Error ? err.message : '加载公告失败');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // 处理表单提交（创建或更新）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      const isUpdate = formData.id && announcements.some(a => a.id === formData.id);
      const method = isUpdate ? 'PUT' : 'POST';
      const url = '/api/admin/announcements';

      const requestBody = isUpdate
        ? {
            id: formData.id,
            content: formData.content,
            is_active: formData.is_active,
            published_at: new Date(formData.published_at).toISOString(),
          }
        : {
            content: formData.content,
            is_active: formData.is_active,
            published_at: new Date(formData.published_at).toISOString(),
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '保存失败');
      }

      setSuccess(isUpdate ? '公告已更新' : '公告已创建');
      await loadAnnouncements();
    } catch (err) {
      console.error('保存公告出错:', err);
      setError(err instanceof Error ? err.message : '保存公告失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 删除公告
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此公告吗？')) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/admin/announcements?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      setSuccess('公告已删除');
      
      // 重置表单
      setFormData({
        id: '',
        content: '',
        is_active: false,
        published_at: new Date().toISOString().split('T')[0],
      });

      await loadAnnouncements();
    } catch (err) {
      console.error('删除公告出错:', err);
      setError(err instanceof Error ? err.message : '删除公告失败');
    }
  };

  if (error && announcements.length === 0) {
    return (
      <AdminLayout>
        <div className="p-4 text-red-800 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 space-y-8">
        {/* 页头 */}
        <div className="flex gap-4 items-start">
          <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-br rounded-xl border from-rose-gold/20 to-dusty-rose/20 border-rose-gold/20">
            <Megaphone className="w-6 h-6 text-dusty-rose" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">系统公告管理</h1>
            <p className="text-muted-foreground mt-1.5">
              配置显示在首页顶部的系统公告通知条
            </p>
          </div>
        </div>

        {/* 提示信息 */}
        {error && (
          <div className="flex gap-3 items-center p-4 text-red-800 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="flex-shrink-0 w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="flex gap-3 items-center p-4 text-green-800 bg-green-50 rounded-lg border border-green-200">
            <AlertCircle className="flex-shrink-0 w-5 h-5" />
            <p>{success}</p>
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 rounded-xl border shadow-sm bg-card">
          <div className="space-y-4">
            {/* 公告内容 */}
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                公告内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="请输入系统公告内容（纯文本）"
                className="w-full min-h-[120px] px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-vertical"
                required
              />
              <p className="text-xs text-muted-foreground">
                公告内容将显示在首页顶部通知条中，建议控制在100字以内
              </p>
            </div>

            {/* 是否显示 */}
            <div className="flex gap-3 items-center p-4 rounded-lg bg-muted/50">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-ring"
              />
              <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                立即显示公告
              </label>
            </div>

            {/* 发布日期 */}
            <div className="space-y-2">
              <label htmlFor="published_at" className="text-sm font-medium">
                发布日期
              </label>
              <input
                type="date"
                id="published_at"
                value={formData.published_at}
                onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                className="px-3 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                发布日期将显示在公告内容旁边
              </p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 items-center pt-4 border-t">
            <Button
              type="submit"
              disabled={isSaving || !formData.content.trim()}
              className="flex gap-2 items-center"
            >
              <Save className="w-4 h-4" />
              {isSaving ? '保存中...' : formData.id ? '更新公告' : '创建公告'}
            </Button>

            {formData.id && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleDelete(formData.id)}
                disabled={isSaving}
                className="flex gap-2 items-center"
              >
                <Trash2 className="w-4 h-4" />
                删除公告
              </Button>
            )}
          </div>
        </form>

        {/* 公告列表 */}
        {isLoading ? (
          <div className="py-12 text-center">加载中...</div>
        ) : announcements.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">历史公告</h2>
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 rounded-lg border shadow-sm transition-shadow bg-card hover:shadow-md"
                >
                  <div className="flex gap-4 justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <p className="text-sm">{announcement.content}</p>
                      <div className="flex gap-3 items-center text-xs text-muted-foreground">
                        <span>
                          {new Date(announcement.published_at).toLocaleDateString('zh-CN')}
                        </span>
                        <span className={announcement.is_active ? 'text-green-600' : ''}>
                          {announcement.is_active ? '✓ 显示中' : '未显示'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          id: announcement.id,
                          content: announcement.content,
                          is_active: announcement.is_active,
                          published_at: new Date(announcement.published_at)
                            .toISOString()
                            .split('T')[0],
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      编辑
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}

