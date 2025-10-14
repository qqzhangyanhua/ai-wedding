/**
 * 生成进度组件
 * 从原 CreatePage 提取，单一职责
 */

import { Loader2 } from 'lucide-react';
import { GenerationStage } from '@/types/generation';
import { GeneratingTips } from './GeneratingTips';

interface GenerationProgressProps {
  stage: GenerationStage;
  progress: number;
}

const STAGE_TEXT: Record<GenerationStage, string> = {
  uploading: '上传照片中...',
  analyzing: '分析面部特征中...',
  generating: 'AI生成图片中...',
  completed: '生成完成！',
};

const STAGE_DESCRIPTION: Record<GenerationStage, string> = {
  uploading: '正在上传您的照片到云端...',
  analyzing: '正在分析您的面部特征,这需要一些时间...',
  generating: '正在使用AI生成您的婚纱照,通常需要1-2分钟...',
  completed: '已完成所有处理,即将跳转！',
};

export function GenerationProgress({ stage, progress }: GenerationProgressProps) {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-2 items-center">
          <Loader2 className="w-4 h-4 animate-spin text-dusty-rose" />
          <span className="text-sm font-medium text-navy">
            {STAGE_TEXT[stage]}
          </span>
        </div>
        <span className="text-sm font-medium text-dusty-rose">{progress}%</span>
      </div>

      <div className="overflow-hidden w-full h-3 rounded-full border bg-champagne border-stone/10">
        <div
          className="h-full bg-gradient-to-r transition-all duration-500 from-rose-gold to-dusty-rose"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-stone">
        {STAGE_DESCRIPTION[stage]}
      </p>

      <GeneratingTips visible={true} />
    </div>
  );
}
