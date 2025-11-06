/**
 * 提示词相关类型定义
 */

/**
 * 单个提示词项
 */
export interface PromptItem {
  /** 中文提示词 */
  chinese: string;
  /** 英文提示词 */
  english: string;
  /** 提示词索引 */
  index: number;
}

/**
 * 提示词生成 API 响应
 */
export interface PromptsResponse {
  /** 是否成功 */
  success: boolean;
  /** 生成的提示词列表（5个） */
  prompts: PromptItem[];
  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * 提示词生成请求参数
 */
export interface GeneratePromptsRequest {
  /** base64 编码的图片 */
  imageBase64: string;
}

