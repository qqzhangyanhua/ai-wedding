/**
 * 模型配置类型定义
 */

export type ModelConfigType = 'generate-image' | 'identify-image' | 'generate-prompts' | 'other';

export type ModelConfigStatus = 'active' | 'inactive';

export type ModelConfigSource = 'openRouter' | '302' | 'openAi';

export interface ModelConfig {
  id: string;
  type: ModelConfigType;
  name: string;
  api_base_url: string;
  api_key: string;
  model_name: string;
  status: ModelConfigStatus;
  source: ModelConfigSource;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

/**
 * 创建模型配置的输入类型（不包含自动生成的字段）
 */
export interface CreateModelConfigInput {
  type: ModelConfigType;
  name: string;
  api_base_url: string;
  api_key: string;
  model_name: string;
  status?: ModelConfigStatus;
  source?: ModelConfigSource;
  description?: string;
}

/**
 * 更新模型配置的输入类型（所有字段可选）
 */
export interface UpdateModelConfigInput {
  type?: ModelConfigType;
  name?: string;
  api_base_url?: string;
  api_key?: string;
  model_name?: string;
  status?: ModelConfigStatus;
  source?: ModelConfigSource;
  description?: string;
}

/**
 * 模型配置列表项（用于前端显示，API Key 已脱敏）
 */
export interface ModelConfigListItem extends Omit<ModelConfig, 'api_key'> {
  api_key_masked: string; // 脱敏后的 API Key，如 "sk-***...***abc"
}

/**
 * API 响应类型
 */
export interface ModelConfigsResponse {
  data: ModelConfig[];
  total: number;
}

export interface ActiveModelConfigResponse {
  data: ModelConfig | null;
}

