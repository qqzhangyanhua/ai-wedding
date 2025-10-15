"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ModelConfigList } from '@/components/admin/ModelConfigList';
import { ModelConfigForm } from '@/components/admin/ModelConfigForm';
import { Plus } from 'lucide-react';
import type { ModelConfig, CreateModelConfigInput, UpdateModelConfigInput } from '@/types/model-config';
import { supabase } from '@/lib/supabase';

export default function AdminModelConfigsPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ModelConfig | null>(null);

  const loadConfigs = useCallback(async () => {
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

      const response = await fetch('/api/admin/model-configs', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError('访问被拒绝，需要管理员权限。');
          return;
        }
        throw new Error('加载配置失败');
      }

      const data = await response.json();
      setConfigs(data.data || []);
    } catch (err) {
      console.error('加载配置出错:', err);
      setError(err instanceof Error ? err.message : '加载配置失败');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleCreate = async (input: CreateModelConfigInput) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/admin/model-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建配置失败');
      }

      setIsFormOpen(false);
      await loadConfigs();
    } catch (err) {
      console.error('创建配置出错:', err);
      alert(err instanceof Error ? err.message : '创建配置失败');
      throw err;
    }
  };

  const handleUpdate = async (id: string, input: UpdateModelConfigInput) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/admin/model-configs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新配置失败');
      }

      setEditingConfig(null);
      setIsFormOpen(false);
      await loadConfigs();
    } catch (err) {
      console.error('更新配置出错:', err);
      alert(err instanceof Error ? err.message : '更新配置失败');
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此配置吗？')) {
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

      const response = await fetch(`/api/admin/model-configs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('删除配置失败');
      }

      await loadConfigs();
    } catch (err) {
      console.error('删除出错:', err);
      alert(err instanceof Error ? err.message : '删除配置失败');
    }
  };

  const handleEdit = async (config: ModelConfig) => {
    try {
      // 获取完整的配置（包括未脱敏的 API Key）
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/admin/model-configs/${config.id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取配置详情失败');
      }

      const data = await response.json();
      setEditingConfig(data.data);
      setIsFormOpen(true);
    } catch (err) {
      console.error('获取配置详情出错:', err);
      alert(err instanceof Error ? err.message : '获取配置详情失败');
    }
  };

  const handleToggleStatus = async (config: ModelConfig) => {
    const newStatus = config.status === 'active' ? 'inactive' : 'active';
    await handleUpdate(config.id, { status: newStatus });
  };

  const handleOpenCreateForm = () => {
    setEditingConfig(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingConfig(null);
    setIsFormOpen(false);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">模型配置管理</h1>
            <p className="text-muted-foreground">管理 AI 模型 API 配置</p>
          </div>
          <Button onClick={handleOpenCreateForm}>
            <Plus className="mr-2 w-4 h-4" />
            新建配置
          </Button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">加载中...</div>
        ) : (
          <ModelConfigList
            configs={configs}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {isFormOpen && (
          <ModelConfigForm
            config={editingConfig}
            onSubmit={editingConfig 
              ? (input) => handleUpdate(editingConfig.id, input as UpdateModelConfigInput) 
              : handleCreate
            }
            onCancel={handleCloseForm}
          />
        )}
      </div>
    </AdminLayout>
  );
}

