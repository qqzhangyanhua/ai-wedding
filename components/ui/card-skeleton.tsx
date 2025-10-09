import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  aspectClass?: string; // 如 'aspect-video' 或 'aspect-[3/4]'
  lines?: number; // 文本行数
  showBadge?: boolean; // 是否显示状态徽标占位
};

export function CardSkeleton({ aspectClass = 'aspect-video', lines = 2, showBadge = true }: Props) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
      <div className={`relative ${aspectClass} w-full`}>
        <Skeleton className="absolute inset-0 w-full h-full" />
        {showBadge && (
          <div className="absolute top-3 right-3">
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        )}
      </div>
      <div className="p-6 space-y-3">
        <Skeleton className="h-5 w-2/3" />
        {Array.from({ length: lines }).map((_, idx) => (
          <Skeleton key={idx} className="h-4 w-5/6" />
        ))}
        {showBadge && (
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        )}
      </div>
    </div>
  );
}

