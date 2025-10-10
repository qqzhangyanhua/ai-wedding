import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function Loading({ size = 'md', text, className }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-dusty-rose', sizeClasses[size])} />
      {text && <p className="text-sm text-stone font-medium">{text}</p>}
    </div>
  );
}

interface PageLoadingProps {
  text?: string;
}

export function PageLoading({ text = '加载中...' }: PageLoadingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-champagne to-ivory flex items-center justify-center">
      <Loading size="lg" text={text} />
    </div>
  );
}

interface ButtonLoadingProps {
  text?: string;
  className?: string;
}

export function ButtonLoading({ text = '处理中...', className }: ButtonLoadingProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Loader2 className="w-4 h-4 animate-spin" />
      {text}
    </span>
  );
}

