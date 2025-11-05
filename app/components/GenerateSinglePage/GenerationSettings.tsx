import { Sparkles } from 'lucide-react';
import { Template } from '@/types/database';
import { ImageGenerationSettings } from './types';

interface GenerationSettingsProps {
  customPrompt: string;
  selectedTemplate: Template | null;
  selectedPromptIndex: number;
  settings: ImageGenerationSettings;
  onCustomPromptChange: (value: string) => void;
  onSettingsChange: (settings: ImageGenerationSettings) => void;
}

export function GenerationSettings({
  customPrompt,
  selectedTemplate,
  selectedPromptIndex,
  settings,
  onCustomPromptChange,
  onSettingsChange,
}: GenerationSettingsProps) {
  return (
    <div className="p-6 mb-8 rounded-xl border shadow-sm bg-ivory border-stone/10">
      <h2 className="mb-4 text-xl font-medium font-display text-navy">生成设置</h2>

      <div className="mb-6">
        <label className="block flex gap-2 items-center mb-2 text-sm font-medium text-navy">
          自定义提示词（英文，可选）
          {!selectedTemplate && (
            <span className="text-xs font-normal text-stone">未选择模板时可用</span>
          )}
        </label>
        <textarea
          value={customPrompt}
          onChange={(e) => onCustomPromptChange(e.target.value)}
          placeholder="例如: Generate a romantic wedding photo in a dreamy sunset beach with soft pink sky and ocean waves..."
          className="w-full px-4 py-3 border border-stone/20 rounded-md focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose transition-all resize-vertical min-h-[120px] disabled:bg-stone/5 disabled:cursor-not-allowed"
          disabled={!!selectedTemplate}
        />
        {selectedTemplate ? (
          <div className="flex gap-2 items-start p-3 mt-2 rounded-md border bg-rose-gold/5 border-rose-gold/20">
            <Sparkles className="w-4 h-4 text-rose-gold flex-shrink-0 mt-0.5" />
            <p className="text-xs text-navy">
              已选择模板 <span className="font-medium">{selectedTemplate.name}</span>
              {selectedTemplate.prompt_list && selectedTemplate.prompt_list.length > 0 && (
                <span> - 风格 {selectedPromptIndex + 1}</span>
              )}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-stone/70">
            提示：可以选择上方的模板，或在此输入自定义提示词
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-2 text-sm font-medium text-navy">
            五官保持强度
          </label>
          <select
            value={settings.facePreservation}
            onChange={(e) => onSettingsChange({
              ...settings,
              facePreservation: e.target.value as ImageGenerationSettings['facePreservation']
            })}
            className="px-4 py-3 w-full rounded-md border transition-all border-stone/20 focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose"
          >
            <option value="high">高（推荐）</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-navy">
            创意程度
          </label>
          <select
            value={settings.creativityLevel}
            onChange={(e) => onSettingsChange({
              ...settings,
              creativityLevel: e.target.value as ImageGenerationSettings['creativityLevel']
            })}
            className="px-4 py-3 w-full rounded-md border transition-all border-stone/20 focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose"
          >
            <option value="conservative">保守（推荐）</option>
            <option value="balanced">平衡</option>
            <option value="creative">创意</option>
          </select>
        </div>
      </div>
    </div>
  );
}
