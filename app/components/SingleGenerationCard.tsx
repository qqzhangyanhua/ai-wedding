import { useState } from 'react';
import Image from 'next/image';
import { Calendar, Coins, Download, Trash2, Eye } from 'lucide-react';
import type { SingleGeneration } from '@/types/database';

interface SingleGenerationCardProps {
  generation: SingleGeneration;
  onDelete?: (id: string) => void;
  onView?: (generation: SingleGeneration) => void;
}

export function SingleGenerationCard({ generation, onDelete, onView }: SingleGenerationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('确定要删除这条生成记录吗？')) return;

    setIsDeleting(true);
    try {
      await onDelete(generation.id);
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  };

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
    <div className="overflow-hidden bg-white rounded-lg border shadow-sm transition-all duration-200 border-stone/10 hover:shadow-md">
      {/* 提示词 */}
      <div className="p-4 border-b bg-champagne/30 border-stone/10">
        <p 
          className="text-sm leading-relaxed text-navy line-clamp-2"
          title={generation.prompt}
        >
          {truncatePrompt(generation.prompt, 120)}
        </p>
      </div>

      {/* 图片对比 */}
      <div className="grid grid-cols-2 gap-2 p-4">
        {/* 原图 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone">原图</p>
          <div className="relative overflow-hidden rounded-md aspect-square bg-champagne">
            <Image
              src={generation.original_image}
              alt="原图"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        </div>

        {/* 结果图 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone">生成结果</p>
          <div className="relative overflow-hidden rounded-md aspect-square bg-champagne">
            <Image
              src={generation.result_image}
              alt="生成结果"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
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

        {/* 右侧操作按钮 */}
        <div className="flex gap-2">
          {onView && (
            <button
              onClick={() => onView(generation)}
              className="p-2 rounded-md transition-colors hover:bg-champagne"
              title="查看详情"
            >
              <Eye className="w-4 h-4 text-navy" />
            </button>
          )}
          <button
            onClick={handleDownload}
            className="p-2 rounded-md transition-colors hover:bg-champagne"
            title="下载结果"
          >
            <Download className="w-4 h-4 text-navy" />
          </button>
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 rounded-md transition-colors hover:bg-rose-100 disabled:opacity-50"
              title="删除记录"
            >
              <Trash2 className="w-4 h-4 text-dusty-rose" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

