import { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useGenerationPolling } from '../hooks/useGenerationPolling';

interface GenerationNotificationProps {
  generationId: string;
  onComplete?: (generationId: string) => void;
  onDismiss?: () => void;
}

export function GenerationNotification({ generationId, onComplete, onDismiss }: GenerationNotificationProps) {
  const { generation, isPolling } = useGenerationPolling(generationId, true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (generation?.status === 'completed' && onComplete) {
      onComplete(generationId);
    }
  }, [generation?.status, generationId, onComplete]);

  if (isDismissed || !generation) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleViewResult = () => {
    window.location.href = `/results/${generationId}`;
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 animate-in slide-in-from-top-5">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {generation.status === 'pending' || generation.status === 'processing' ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            ) : generation.status === 'completed' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                {generation.status === 'pending' && '排队中...'}
                {generation.status === 'processing' && '生成中...'}
                {generation.status === 'completed' && '生成完成！'}
                {generation.status === 'failed' && '生成失败'}
              </h3>
              <p className="text-xs text-gray-600">{generation.project?.name}</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {(generation.status === 'pending' || generation.status === 'processing') && (
          <div className="space-y-2">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-pink-600 animate-pulse w-2/3" />
            </div>
            <p className="text-xs text-gray-500">
              {generation.status === 'pending' && '正在排队等待处理...'}
              {generation.status === 'processing' && 'AI正在生成您的婚纱照...'}
            </p>
          </div>
        )}

        {generation.status === 'completed' && (
          <button
            onClick={handleViewResult}
            className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-lg hover:from-blue-700 hover:to-pink-700 transition-all font-medium text-sm"
          >
            查看结果
          </button>
        )}

        {generation.status === 'failed' && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">
              {generation.error_message || '生成过程中出现错误，请稍后重试'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
