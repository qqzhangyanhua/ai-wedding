import type { ProjectStatus, GenerationStatus } from '@/types/status';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  credits: number;
  role: 'user' | 'admin';
  // 邀请相关字段（可选）
  invite_code?: string;
  invited_by?: string | null;
  invite_count?: number;
  reward_credits?: number;
  created_at: string;
  updated_at: string;
}

/**
 * AI 生成提示词配置
 */
export interface PromptConfig {
  basePrompt: string;
  styleModifiers?: string[];
  negativePrompt?: string;
  cfgScale?: number;
  steps?: number;
  seed?: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'location' | 'fantasy' | 'artistic' | 'classic';
  preview_image_url: string;
  prompt_config: PromptConfig;
  // 多提示词（可选），为空时按单提示词处理
  prompt_list?: string[];
  price_credits: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  status: ProjectStatus;
  uploaded_photos: string[];
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  project_id: string;
  user_id: string;
  template_id: string;
  status: GenerationStatus;
  preview_images: string[];
  high_res_images: string[];
  error_message?: string;
  credits_used: number;
  is_shared_to_gallery: boolean;
  created_at: string;
  completed_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  generation_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  payment_intent_id?: string;
  purchased_images: string[];
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  template_id: string;
  created_at: string;
}

// 复合类型：用于前端视图/Hook 的聚合结构

export interface ProjectWithTemplate {
  id: string;
  name: string;
  status: ProjectStatus | string; // 后端可能返回字符串，前端做兜底
  uploaded_photos: string[];
  created_at: string;
  updated_at: string;
  template?: {
    id: string;
    name: string;
    preview_image_url: string;
  };
  generation?: {
    id: string;
    status: GenerationStatus | string;
    preview_images: string[];
    completed_at: string;
    is_shared_to_gallery?: boolean;
  };
}

export interface GenerationWithRelations {
  id: string;
  status: GenerationStatus | string;
  preview_images?: string[];
  high_res_images?: string[];
  error_message?: string;
  is_shared_to_gallery?: boolean;
  completed_at?: string;
  project: {
    name: string;
    uploaded_photos?: string[];
  };
  template: {
    name: string;
  };
}

// 画廊展示项目的类型定义
export interface GalleryItem {
  id: string;
  preview_images: string[];
  project_name: string;
  template_name: string;
  user_name: string;
  created_at: string;
}

// 系统公告类型定义
export interface SystemAnnouncement {
  id: string;
  content: string;
  is_active: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}
