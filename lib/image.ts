/**
 * 客户端图片生成调用工具（调用本地 Next.js API 路由，安全不暴露密钥）。
 * 返回 URL 列表或 base64 列表，取决于服务端 response_format。
 */
export type GenerateOptions = {
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024' | string;
  response_format?: 'url' | 'b64_json';
  model?: string; // 可选：若需覆盖服务端默认模型
  image_inputs?: string[]; // 可选：传递 dataURL 的参考图像（最多3张，chat模式使用）
};

import { supabase } from '@/src/lib/supabase';

export async function generateImage(prompt: string, options: GenerateOptions = {}) {
  // 从 Supabase 获取会话，附带用户会话 Token 供服务端认证
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, ...options }),
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error || '生成失败';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  // 兼容返回结构：{ data: { data: [...] } }（服务端已包裹）
  const items = json?.data?.data || [];
  return items as Array<{ url?: string; b64_json?: string; data_url?: string; mime?: string }>;
}
