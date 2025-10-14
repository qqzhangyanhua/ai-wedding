import * as React from 'react';
import { cn } from '@/lib/utils';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-shimmer rounded-md bg-champagne/60 dark:bg-stone/20', className)}
      {...props}
    />
  );
}
