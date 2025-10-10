import { useGenerationPolling } from '../hooks/useGenerationPolling';
import { useEffect, useState } from 'react';

interface ProjectProgressProps {
  generationId: string;
  onComplete?: () => void;
}

export function ProjectProgress({ generationId, onComplete }: ProjectProgressProps) {
  const { generation } = useGenerationPolling(generationId, true);
  const [progress, setProgress] = useState(0);
  const generationStatus = generation?.status;

  useEffect(() => {
    if (!generationStatus) return;

    // 根据状态设置进度
    switch (generationStatus) {
      case 'pending':
        setProgress(10);
        break;
      case 'processing':
        // 模拟处理进度：10% -> 90%
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval);
              return 90;
            }
            return Math.min(prev + 5, 90);
          });
        }, 2000);
        return () => clearInterval(interval);
      case 'completed':
        setProgress(100);
        if (onComplete) onComplete();
        break;
      case 'failed':
        setProgress(0);
        break;
      default:
        setProgress(0);
    }
  }, [generationStatus, onComplete]);

  if (generationStatus === 'completed' || generationStatus === 'failed' || !generationStatus) {
    return null;
  }

  const getProgressColor = () => {
    if (progress < 30) return 'bg-yellow-500';
    if (progress < 70) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (generationStatus === 'pending') return '排队中...';
    if (generationStatus === 'processing') {
      if (progress < 30) return '准备中...';
      if (progress < 70) return '生成中...';
      return '即将完成...';
    }
    return '处理中...';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 font-medium">{getStatusText()}</span>
        <span className="text-gray-700 font-bold">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-500 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
