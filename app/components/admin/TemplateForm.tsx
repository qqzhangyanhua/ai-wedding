"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { Template, PromptConfig } from '@/types/database';
import type { TemplateFormInput } from '@/types/admin';
import { ImageUploadField } from './ImageUploadField';
import { PromptConfigEditor } from './PromptConfigEditor';
import { PromptListEditor } from './PromptListEditor';

interface TemplateFormProps {
  template?: Template;
  onSubmit: (data: TemplateFormInput) => Promise<void>;
  onCancel: () => void;
}

// 分类选项（仅中文标签，value 为存储值）
const CATEGORIES = [
  { value: 'location', label: '地点' },
  { value: 'fantasy', label: '奇幻' },
  { value: 'artistic', label: '艺术' },
  { value: 'classic', label: '经典' },
] as const;

export function TemplateForm({ template, onSubmit, onCancel }: TemplateFormProps) {
  const [formData, setFormData] = useState<TemplateFormInput>({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'location',
    preview_image_url: template?.preview_image_url || '',
    prompt_config: template?.prompt_config || {
      basePrompt: '',
      styleModifiers: [],
      negativePrompt: '',
    },
    prompt_list: template?.prompt_list || [],
    price_credits: template?.price_credits || 10,
    is_active: template?.is_active !== undefined ? template.is_active : true,
    sort_order: template?.sort_order || 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.preview_image_url) {
      alert('请填写所有必填项');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('表单提交出错:', error);
      alert(error instanceof Error ? error.message : '保存模板失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (updates: Partial<TemplateFormInput>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const updatePromptConfig = (config: PromptConfig) => {
    setFormData((prev) => ({ ...prev, prompt_config: config }));
  };

  const updatePromptList = (list: string[]) => {
    setFormData((prev) => ({ ...prev, prompt_list: list }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            模板名称 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="例如：巴黎浪漫"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">
            分类 <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value: string) =>
              updateFormData({
                category: value as TemplateFormInput['category'],
              })
            }
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData({ description: e.target.value })}
          placeholder="请输入模板描述..."
          rows={3}
        />
      </div>

      <ImageUploadField
        currentUrl={formData.preview_image_url}
        onUrlChange={(url) => updateFormData({ preview_image_url: url })}
      />

      <PromptConfigEditor
        config={formData.prompt_config}
        onChange={updatePromptConfig}
      />

      <PromptListEditor
        value={formData.prompt_list || []}
        onChange={updatePromptList}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="price_credits">价格（积分）</Label>
          <Input
            id="price_credits"
            type="number"
            min="0"
            value={formData.price_credits}
            onChange={(e) =>
              updateFormData({ price_credits: parseInt(e.target.value) || 0 })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort_order">排序权重</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) =>
              updateFormData({ sort_order: parseInt(e.target.value) || 0 })
            }
          />
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked: boolean) => updateFormData({ is_active: checked })}
          />
          <Label htmlFor="is_active">启用</Label>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {template ? '更新模板' : '创建模板'}
        </Button>
      </div>
    </form>
  );
}
