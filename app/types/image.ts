// 图像相关的通用类型

// 客户端图片生成参数（调用本地 Next API）
export type GenerateOptions = {
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024' | string;
  response_format?: 'url' | 'b64_json';
  model?: string;
  image_inputs?: string[]; // dataURL
};

// 流式图片生成
export interface StreamImageOptions {
  prompt: string;
  imageInputs?: string[]; // dataURL
  n?: number;
  model?: string;
  onProgress?: (content: string) => void;
  onStatus?: (status: 'connecting' | 'streaming' | 'parsing' | 'completed' | 'error') => void;
}

export interface StreamImageResult {
  content: string;
  imageData?: {
    type: string;
    base64: string;
    dataUrl: string;
  };
}

// 浏览器侧 dataURL 压缩
export type CompressOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0~1，仅 JPEG/WebP 生效
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
};

// 质量评估
export interface QualityResult {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'poor';
  issues: string[];
  checks: {
    resolution: { passed: boolean; width: number; height: number };
    sharpness: { passed: boolean; score: number };
    brightness: { passed: boolean; score: number };
  };
}

// 图片评分（用于排序展示）
export interface ImageRating {
  score: number; // 0-100
  badges: string[];
  rank: 'top' | 'good' | 'normal';
}

// 本地试用模式的伪生成
export interface MockGenerateOptions {
  input: string; // dataURL
  variants?: number; // 默认 3
  watermark?: string; // 默认 “AI婚纱照·试用”
}

