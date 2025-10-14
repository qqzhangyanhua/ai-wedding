"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import type { PromptConfig } from '@/types/database';

interface PromptConfigEditorProps {
  config: PromptConfig;
  onChange: (config: PromptConfig) => void;
}

export function PromptConfigEditor({ config, onChange }: PromptConfigEditorProps) {
  const [newModifier, setNewModifier] = useState('');

  const updateConfig = (updates: Partial<PromptConfig>) => {
    onChange({ ...config, ...updates });
  };

  const addStyleModifier = () => {
    if (!newModifier.trim()) return;

    const modifiers = config.styleModifiers || [];
    updateConfig({
      styleModifiers: [...modifiers, newModifier.trim()],
    });
    setNewModifier('');
  };

  const removeStyleModifier = (index: number) => {
    const modifiers = config.styleModifiers || [];
    updateConfig({
      styleModifiers: modifiers.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-semibold">提示词配置</h3>

      <div className="space-y-2">
        <Label htmlFor="basePrompt">基础提示词</Label>
        <Textarea
          id="basePrompt"
          value={config.basePrompt || ''}
          onChange={(e) => updateConfig({ basePrompt: e.target.value })}
          placeholder="例如：在巴黎埃菲尔铁塔前的婚礼照片..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>风格修饰词</Label>
        <div className="flex gap-2">
          <Input
            value={newModifier}
            onChange={(e) => setNewModifier(e.target.value)}
            placeholder="例如：电影质感光影"
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addStyleModifier();
              }
            }}
          />
          <Button type="button" onClick={addStyleModifier} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {config.styleModifiers && config.styleModifiers.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {config.styleModifiers.map((modifier, index) => (
              <div
                key={index}
                className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1 text-sm"
              >
                <span>{modifier}</span>
                <button
                  type="button"
                  onClick={() => removeStyleModifier(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="negativePrompt">反向提示词</Label>
        <Textarea
          id="negativePrompt"
          value={config.negativePrompt || ''}
          onChange={(e) => updateConfig({ negativePrompt: e.target.value })}
          placeholder="例如：模糊、低质量、畸变..."
          rows={2}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="cfgScale">CFG 强度</Label>
          <Input
            id="cfgScale"
            type="number"
            step="0.1"
            min="1"
            max="20"
            value={config.cfgScale || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateConfig({
                cfgScale: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder="7.5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="steps">迭代步数</Label>
          <Input
            id="steps"
            type="number"
            min="1"
            max="150"
            value={config.steps || ''}
            onChange={(e) =>
              updateConfig({
                steps: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            placeholder="50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seed">种子</Label>
          <Input
            id="seed"
            type="number"
            value={config.seed || ''}
            onChange={(e) =>
              updateConfig({
                seed: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            placeholder="随机"
          />
        </div>
      </div>
    </div>
  );
}
