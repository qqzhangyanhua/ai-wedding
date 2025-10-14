// 统一状态类型定义（项目/生成）
// 仅包含类型，不含业务逻辑

export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type StatusVisual = {
  icon: 'check' | 'clock' | 'alert';
  colorClass: string;
  spin?: boolean;
};

