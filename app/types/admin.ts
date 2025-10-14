import type { PromptConfig } from '@/types/database';

/**
 * Template form input for admin create/update
 */
export interface TemplateFormInput {
  name: string;
  description: string;
  category: 'location' | 'fantasy' | 'artistic' | 'classic';
  preview_image_url: string;
  prompt_config: PromptConfig;
  // 新增：多提示词（可选）
  prompt_list?: string[];
  price_credits: number;
  is_active: boolean;
  sort_order: number;
}

/**
 * Template create payload for API
 */
export interface CreateTemplatePayload {
  name: string;
  description: string;
  category: string;
  preview_image_url: string;
  prompt_config: PromptConfig;
  prompt_list?: string[];
  price_credits: number;
  is_active: boolean;
  sort_order: number;
}

/**
 * Template update payload for API
 */
export interface UpdateTemplatePayload extends Partial<CreateTemplatePayload> {
  id: string;
}
