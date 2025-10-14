// 统一的状态与文案映射（项目/生成）
// 仅返回纯数据，UI 图标与颜色由上层组件决定
import type { ProjectStatus, GenerationStatus, StatusVisual } from '@/types/status';

export function getStatusLabel(status: ProjectStatus | GenerationStatus): string {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'processing':
      return '处理中';
    case 'pending':
      return '等待中';
    case 'draft':
      return '草稿';
    case 'failed':
      return '失败';
    default:
      return '未知';
  }
}

export function getStatusKind(status: ProjectStatus | GenerationStatus): 'success' | 'warning' | 'info' | 'error' | 'default' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'processing':
    case 'pending':
      return 'warning';
    case 'failed':
      return 'error';
    case 'draft':
      return 'default';
    default:
      return 'default';
  }
}

export function getStatusVisual(status: ProjectStatus | GenerationStatus): StatusVisual {
  const kind = getStatusKind(status);
  switch (kind) {
    case 'success':
      return { icon: 'check', colorClass: 'text-green-600' };
    case 'warning':
      return { icon: 'clock', colorClass: 'text-yellow-600', spin: true };
    case 'error':
      return { icon: 'alert', colorClass: 'text-red-600' };
    case 'default':
    default:
      return { icon: 'alert', colorClass: 'text-gray-400' };
  }
}
