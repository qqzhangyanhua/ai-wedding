import { useState } from 'react';
import Image from 'next/image';
import { X, Download, Calendar, Coins, Settings } from 'lucide-react';
import type { SingleGeneration } from '@/types/database';

interface SingleGenerationDetailModalProps {
  generation: SingleGeneration;
  isOpen: boolean;
  onClose: () => void;
}

export function SingleGenerationDetailModal({
  generation,
  isOpen,
  onClose,
}: SingleGenerationDetailModalProps) {
  const [activeImage, setActiveImage] = useState<'original' | 'result'>('result');

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = generation.result_image;
      link.download = `single-generation-${generation.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('下载失败:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFacePreservationLabel = (level?: string) => {
    switch (level) {
      case 'high': return '高（推荐）';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '未知';
    }
  };

  const getCreativityLevelLabel = (level?: string) => {
    switch (level) {
      case 'conservative': return '保守（推荐）';
      case 'balanced': return '平衡';
      case 'creative': return '创意';
      default: return '未知';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/50">
      <div className="overflow-hidden relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl">
        {/* 头部 */}
        <div className="flex justify-between items-center p-6 border-b bg-champagne/30 border-stone/10">
          <h2 className="text-xl font-medium font-display text-navy">生成详情</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors hover:bg-white/50"
          >
            <X className="w-5 h-5 text-stone" />
          </button>
        </div>

        {/* 内容区域 - 可滚动 */}
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 左侧：提示词和设置信息 */}
            <div className="space-y-6">
              {/* 提示词 */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-stone">提示词</h3>
                <div className="p-4 rounded-lg border bg-ivory/50 border-stone/10">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-navy">
                    {generation.prompt}
                  </p>
                </div>
              </div>

              {/* 生成设置 */}
              <div>
                <h3 className="flex gap-2 items-center mb-3 text-sm font-medium text-stone">
                  <Settings className="w-4 h-4" />
                  生成设置
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-ivory/50">
                    <span className="text-sm text-stone">五官保持强度</span>
                    <span className="text-sm font-medium text-navy">
                      {getFacePreservationLabel(generation.settings.facePreservation)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-ivory/50">
                    <span className="text-sm text-stone">创意程度</span>
                    <span className="text-sm font-medium text-navy">
                      {getCreativityLevelLabel(generation.settings.creativityLevel)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 其他信息 */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-stone">其他信息</h3>
                <div className="space-y-3">
                  <div className="flex gap-2 items-center p-3 rounded-lg bg-ivory/50">
                    <Calendar className="w-4 h-4 text-stone" />
                    <span className="text-sm text-navy">{formatDate(generation.created_at)}</span>
                  </div>
                  <div className="flex gap-2 items-center p-3 rounded-lg bg-ivory/50">
                    <Coins className="w-4 h-4 text-stone" />
                    <span className="text-sm text-navy">消耗 {generation.credits_used} 积分</span>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <button
                onClick={handleDownload}
                className="flex gap-2 justify-center items-center px-6 py-3 w-full font-medium rounded-lg shadow-sm transition-all duration-200 bg-navy text-ivory hover:bg-navy/90 hover:shadow-md"
              >
                <Download className="w-4 h-4" />
                下载结果图
              </button>
            </div>

            {/* 右侧：图片预览 */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveImage('original')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeImage === 'original'
                      ? 'bg-navy text-ivory shadow-sm'
                      : 'bg-champagne text-stone hover:bg-champagne/70'
                  }`}
                >
                  原图
                </button>
                <button
                  onClick={() => setActiveImage('result')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeImage === 'result'
                      ? 'bg-navy text-ivory shadow-sm'
                      : 'bg-champagne text-stone hover:bg-champagne/70'
                  }`}
                >
                  生成结果
                </button>
              </div>

              {/* 图片展示 */}
              <div className="relative overflow-hidden rounded-lg aspect-square bg-champagne">
                <Image
                  src={activeImage === 'original' ? generation.original_image : generation.result_image}
                  alt={activeImage === 'original' ? '原图' : '生成结果'}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              {/* 图片对比缩略图 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-center text-stone">原图</p>
                  <div className="relative overflow-hidden rounded-md aspect-square bg-champagne">
                    <Image
                      src={generation.original_image}
                      alt="原图缩略图"
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-center text-stone">结果</p>
                  <div className="relative overflow-hidden rounded-md aspect-square bg-champagne">
                    <Image
                      src={generation.result_image}
                      alt="结果缩略图"
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

