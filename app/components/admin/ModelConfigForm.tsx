"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { ModelConfig, CreateModelConfigInput, ModelConfigType, ModelConfigStatus, ModelConfigSource } from '@/types/model-config';

interface ModelConfigFormProps {
  config?: ModelConfig | null;
  onSubmit: (input: CreateModelConfigInput) => Promise<void>;
  onCancel: () => void;
}

export function ModelConfigForm({ config, onSubmit, onCancel }: ModelConfigFormProps) {
  const [formData, setFormData] = useState({
    type: 'generate-image' as ModelConfigType,
    name: '',
    api_base_url: '',
    api_key: '',
    model_name: '',
    status: 'inactive' as ModelConfigStatus,
    source: 'openAi' as ModelConfigSource,
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        type: config.type,
        name: config.name,
        api_base_url: config.api_base_url,
        api_key: config.api_key,
        model_name: config.model_name,
        status: config.status,
        source: config.source,
        description: config.description || '',
      });
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.api_base_url || !formData.api_key || !formData.model_name) {
      alert('请填写所有必填字段');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">
            {config ? '编辑配置' : '新建配置'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">
              配置类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="px-3 py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
           
            >
              <option value="generate-image">图片生成</option>
              <option value="other">其他</option>
              <option value="identify-image">识别图片</option>
              <option value="generate-prompts">生成提示词</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              配置名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="例如：默认图片生成配置"
              className="px-3 py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              API Base URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={formData.api_base_url}
              onChange={(e) => handleChange('api_base_url', e.target.value)}
              placeholder="https://api.example.com"
              className="px-3 py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => handleChange('api_key', e.target.value)}
              placeholder="sk-..."
              className="px-3 py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              敏感信息，请妥善保管
            </p>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              模型名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.model_name}
              onChange={(e) => handleChange('model_name', e.target.value)}
              placeholder="例如：gemini-2.5-flash-image"
              className="px-3 py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              状态 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="px-3 py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="inactive">停用</option>
              <option value="active">激活</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              同一类型只能有一个激活配置，激活此配置将自动停用其他配置
            </p>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              模型来源 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value)}
              className="px-3 py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="openAi">OpenAI</option>
              <option value="openRouter">OpenRouter</option>
              <option value="302">302.AI</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              选择模型的API提供商
            </p>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="配置说明..."
              rows={3}
              className="px-3 py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : config ? '更新' : '创建'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

