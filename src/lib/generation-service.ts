/**
 * 图片生成服务 - 分离游客模式和认证模式
 *
 * 设计原则：
 * 1. 游客模式：纯前端模拟，不写数据库
 * 2. 认证模式：完整流程，包含数据库操作
 * 3. 不在一个函数里用 if (!profile) 判断
 */

import { supabase } from './supabase';
import { generateImageStream } from '@/lib/image-stream';
import { mockGenerateImages } from '@/lib/mock-generator';
import { Template } from '../types/database';

export interface GenerationInput {
  photos: string[];
  projectName: string;
  template: Template;
}

export interface GenerationProgress {
  stage: 'uploading' | 'analyzing' | 'generating' | 'completed';
  progress: number;
}

export interface GenerationResult {
  images: string[];
  generationId: string | null;
}

/**
 * 游客模式生成 - 本地模拟
 */
export async function generateAsGuest(
  input: GenerationInput,
  onProgress: (progress: GenerationProgress) => void
): Promise<GenerationResult> {
  onProgress({ stage: 'uploading', progress: 5 });

  // 模拟上传延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  onProgress({ stage: 'analyzing', progress: 25 });

  // 使用 mock 生成器
  const images = await mockGenerateImages({
    input: input.photos[0],
    variants: 3,
  });

  onProgress({ stage: 'generating', progress: 80 });

  await new Promise(resolve => setTimeout(resolve, 500));

  onProgress({ stage: 'completed', progress: 100 });

  return {
    images,
    generationId: null,
  };
}

/**
 * 认证用户生成 - 完整流程
 */
export async function generateAsAuthenticated(
  input: GenerationInput,
  userId: string,
  onProgress: (progress: GenerationProgress) => void
): Promise<GenerationResult> {
  // 步骤 1: 创建项目记录
  onProgress({ stage: 'uploading', progress: 5 });

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: input.projectName,
      status: 'processing',
      uploaded_photos: input.photos,
    })
    .select()
    .single();

  if (projectError) throw projectError;

  onProgress({ stage: 'uploading', progress: 20 });

  // 步骤 2: 创建生成记录
  const { data: generation, error: generationError } = await supabase
    .from('generations')
    .insert({
      project_id: project.id,
      user_id: userId,
      template_id: input.template.id,
      status: 'processing',
      credits_used: input.template.price_credits,
    })
    .select()
    .single();

  if (generationError) throw generationError;

  onProgress({ stage: 'analyzing', progress: 40 });

  // 步骤 3: 扣除积分（注意：应该在事务中处理，但 Supabase 客户端不支持）
  const { error: creditError } = await supabase.rpc('deduct_credits', {
    user_id: userId,
    amount: input.template.price_credits,
  });

  if (creditError) {
    // 回滚：删除生成记录
    await supabase.from('generations').delete().eq('id', generation.id);
    throw new Error(`积分扣除失败: ${creditError.message}`);
  }

  onProgress({ stage: 'generating', progress: 50 });

  // 步骤 4: 调用 AI 生成
  const prompt = `${input.template.name}: ${input.template.description || ''} wedding portrait, high quality, cinematic lighting`;

  const result = await generateImageStream({
    prompt,
    imageInputs: input.photos.length > 0 ? [input.photos[0]] : undefined,
    n: 4,
    onProgress: (content) => {
      console.log('生成进度:', content.length, '字符');
    },
    onStatus: (status) => {
      if (status === 'streaming') {
        onProgress({ stage: 'generating', progress: 60 });
      } else if (status === 'parsing') {
        onProgress({ stage: 'generating', progress: 80 });
      }
    },
  });

  if (!result.imageData) {
    throw new Error('未能生成图片');
  }

  // 步骤 5: 上传到 MinIO
  const generatedDataUrl = result.imageData.dataUrl;
  let imageUrl: string;

  try {
    const uploadResponse = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: generatedDataUrl,
        folder: 'generated',
      }),
    });

    if (!uploadResponse.ok) {
      throw new Error(`上传失败: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();
    imageUrl = uploadResult.url;
  } catch (uploadError) {
    console.error('MinIO 上传失败，使用 dataUrl 回退:', uploadError);
    imageUrl = generatedDataUrl;
  }

  onProgress({ stage: 'generating', progress: 90 });

  // 步骤 6: 更新生成记录为完成状态
  const { error: updateError } = await supabase
    .from('generations')
    .update({
      status: 'completed',
      preview_images: [imageUrl],
      completed_at: new Date().toISOString(),
    })
    .eq('id', generation.id);

  if (updateError) {
    console.error('更新 generation 状态失败:', updateError);
  }

  onProgress({ stage: 'completed', progress: 100 });

  return {
    images: [imageUrl],
    generationId: generation.id,
  };
}

/**
 * 标记生成失败 - 回滚数据库状态
 */
export async function markGenerationFailed(
  generationId: string,
  error: string
): Promise<void> {
  await supabase
    .from('generations')
    .update({
      status: 'failed',
      error_message: error,
    })
    .eq('id', generationId);
}
