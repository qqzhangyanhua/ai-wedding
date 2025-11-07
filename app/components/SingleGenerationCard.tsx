import { useState } from 'react';
import Image from 'next/image';
import { Calendar, Coins, Eye } from 'lucide-react';
import { ImagePreviewModal } from './ImagePreviewModal';
import type { SingleGeneration } from '@/types/database';

interface SingleGenerationCardProps {
  generation: SingleGeneration;
  onDelete?: (id: string) => void;
  onView?: (generation: SingleGeneration) => void;
}

export function SingleGenerationCard({ generation, onView }: SingleGenerationCardProps) {
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncatePrompt = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <div className="overflow-hidden bg-white rounded-lg border shadow-sm transition-all duration-200 border-stone/10 hover:shadow-md">
        {/* 提示词 - 悬浮显示完整内容 */}
        <div className="relative p-4 border-b bg-champagne/30 border-stone/10 group">
          <p 
            className="text-sm leading-relaxed cursor-help text-navy line-clamp-2"
            title={generation.prompt.length > 120 ? '悬浮查看完整提示词' : generation.prompt}
          >
            {truncatePrompt(generation.prompt, 120)}
          </p>
          
          {/* 悬浮显示完整提示词 */}
          {generation.prompt.length > 120 && (
            <div className="hidden absolute right-0 left-0 top-full z-20 pt-2 group-hover:block">
              <div className="p-4 bg-white rounded-lg border shadow-xl duration-200 border-stone/20 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-2 justify-between items-start mb-2">
                  <p className="text-xs font-medium text-stone">完整提示词</p>
                  <span className="text-xs text-stone/60">{generation.prompt.length} 字符</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-navy max-h-[300px] overflow-y-auto">
                  {generation.prompt}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 图片对比 - 点击查看大图 */}
        <div className="grid grid-cols-2 gap-3 p-4">
          {/* 原图 */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-stone">原图</p>
            <button 
              type="button"
              className="overflow-hidden relative w-full rounded-lg transition-all aspect-square bg-champagne group focus:outline-none focus:ring-2 focus:ring-dusty-rose focus:ring-offset-2"
              onClick={() => setPreviewImage({ src: generation.original_image, alt: '原图' })}
              aria-label="查看原图大图"
            >
              <Image
                src={generation.original_image}
                alt="原图"
                fill
                className="object-cover transition-all duration-300 ease-out group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {/* 悬浮提示 */}
              <div className="flex absolute inset-0 justify-center items-center opacity-0 transition-all duration-300 bg-black/50 group-hover:opacity-100">
                <div className="text-center transition-transform duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <p className="text-sm font-medium text-white drop-shadow-lg">点击查看大图</p>
                </div>
              </div>
            </button>
          </div>

          {/* 结果图 */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-stone">生成结果</p>
            <button 
              type="button"
              className="overflow-hidden relative w-full rounded-lg transition-all aspect-square bg-champagne group focus:outline-none focus:ring-2 focus:ring-dusty-rose focus:ring-offset-2"
              onClick={() => setPreviewImage({ src: generation.result_image, alt: '生成结果' })}
              aria-label="查看生成结果大图"
            >
              <Image
                src={generation.result_image}
                alt="生成结果"
                fill
                className="object-cover transition-all duration-300 ease-out group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {/* 悬浮提示 */}
              <div className="flex absolute inset-0 justify-center items-center opacity-0 transition-all duration-300 bg-black/50 group-hover:opacity-100">
                <div className="text-center transition-transform duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <p className="text-sm font-medium text-white drop-shadow-lg">点击查看大图</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 底部信息和操作 */}
        <div className="flex justify-between items-center p-4 border-t bg-ivory/50 border-stone/10">
          {/* 左侧信息 */}
          <div className="flex gap-4 items-center text-xs text-stone">
            <div className="flex gap-1 items-center" title="创建时间">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(generation.created_at)}</span>
            </div>
            <div className="flex gap-1 items-center" title="消耗积分">
              <Coins className="w-3.5 h-3.5" />
              <span>{generation.credits_used}</span>
            </div>
          </div>

          {/* 右侧操作按钮 - 只保留查看详情 */}
          {onView && (
            <button
              onClick={() => onView(generation)}
              className="p-2 rounded-md transition-colors hover:bg-champagne"
              title="查看详情"
            >
              <Eye className="w-4 h-4 text-navy" />
            </button>
          )}
        </div>
      </div>

      {/* 图片预览弹窗 */}
      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </>
  );
}

