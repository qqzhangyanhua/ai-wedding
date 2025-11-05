"use client";

import { Button } from '@/components/ui/button';
import { Edit, Trash2, Power, PowerOff, Copy, Check } from 'lucide-react';
import type { ModelConfig } from '@/types/model-config';
import { useState } from 'react';

interface ModelConfigListProps {
  configs: ModelConfig[];
  onEdit: (config: ModelConfig) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (config: ModelConfig) => void;
}

const TYPE_LABELS: Record<string, string> = {
  'generate-image': '图片生成',
  'other': '其他',
};

const STATUS_LABELS: Record<string, string> = {
  'active': '激活',
  'inactive': '停用',
};

const SOURCE_LABELS: Record<string, string> = {
  'openAi': 'OpenAI',
  'openRouter': 'OpenRouter',
  '302': '302.AI',
};

export function ModelConfigList({ configs, onEdit, onDelete, onToggleStatus }: ModelConfigListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyApiKey = async (config: ModelConfig) => {
    try {
      // 这里显示的是脱敏的 API Key，实际复制需要从详情接口获取
      // 为了简化，这里只是示例
      const apiKeyMasked = (config as unknown as { api_key_masked?: string }).api_key_masked || '***';
      await navigator.clipboard.writeText(apiKeyMasked);
      setCopiedId(config.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  if (configs.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        暂无配置，创建你的第一个模型配置吧。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {configs.map((config) => {
        const apiKeyMasked = (config as unknown as { api_key_masked?: string }).api_key_masked || '***';
        const isActive = config.status === 'active';

        return (
          <div
            key={config.id}
            className={`p-4 rounded-lg border ${
              isActive ? 'border-green-500 bg-green-50/50' : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{config.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {STATUS_LABELS[config.status]}
                  </span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {TYPE_LABELS[config.type] || config.type}
                  </span>
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                    {SOURCE_LABELS[config.source] || config.source}
                  </span>
                </div>

                {config.description && (
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">API Base URL:</span>
                    <p className="mt-1 font-mono text-xs break-all">{config.api_base_url}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">模型名称:</span>
                    <p className="mt-1 font-mono text-xs">{config.model_name}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-muted-foreground">API Key:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-2 py-1 text-xs bg-gray-100 rounded">
                        {apiKeyMasked}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => handleCopyApiKey(config)}
                        title="复制 API Key"
                      >
                        {copiedId === config.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>创建时间: {new Date(config.created_at).toLocaleString('zh-CN')}</span>
                  <span>更新时间: {new Date(config.updated_at).toLocaleString('zh-CN')}</span>
                </div>
              </div>

              <div className="flex gap-2 items-center ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleStatus(config)}
                  title={isActive ? '停用' : '激活'}
                >
                  {isActive ? (
                    <Power className="w-4 h-4 text-green-600" />
                  ) : (
                    <PowerOff className="w-4 h-4 text-gray-400" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(config)}
                  title="编辑"
                >
                  <Edit className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(config.id)}
                  title="删除"
                  className="hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

