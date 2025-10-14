"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

interface PromptListEditorProps {
  value?: string[];
  onChange: (list: string[]) => void;
}

/**
 * 多提示词编辑器
 * - 每条为一行基础提示词
 * - 允许增删
 */
export function PromptListEditor({ value = [], onChange }: PromptListEditorProps) {
  const [newPrompt, setNewPrompt] = useState('');

  const addPrompt = () => {
    const text = newPrompt.trim();
    if (!text) return;
    onChange([...(value || []), text]);
    setNewPrompt('');
  };

  const removePrompt = (index: number) => {
    const next = (value || []).filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="space-y-2">
        <Label>多提示词（可选）</Label>
        <p className="text-sm text-muted-foreground">
          每条为一段基础提示词。生成时：1 条提示词生成 1 张图；多条则分别生成多张。
        </p>
        <div className="flex gap-2">
          <Input
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="请输入一条基础提示词，回车添加"
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPrompt();
              }
            }}
          />
          <Button type="button" onClick={addPrompt} size="icon" aria-label="添加提示词">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {value && value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {value.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm">
              <span className="max-w-[28rem] truncate" title={p}>{p}</span>
              <button
                type="button"
                onClick={() => removePrompt(idx)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="删除提示词"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

