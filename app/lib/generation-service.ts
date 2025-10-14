/**
 * 图片生成服务 - 分离游客模式和认证模式
 *
 * 设计原则：
 * 1. 游客模式：纯前端模拟，不写数据库
 * 2. 认证模式：调用封装的 API 路由
 * 3. 不在一个函数里用 if (!profile) 判断
 */

import { supabase } from './supabase';
import { mockGenerateImages } from '@/lib/mock-generator';
import type { GenerationInput, GenerationProgress, GenerationResult } from '@/types/generation';

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
 * 认证用户生成 - 直接调用流式 API
 */
export async function generateAsAuthenticated(
  input: GenerationInput,
  userId: string,
  onProgress: (progress: GenerationProgress) => void
): Promise<GenerationResult> {
  onProgress({ stage: 'uploading', progress: 5 });

  // 获取 Supabase token
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('未登录，请先登录');
  }

  // 1. 检查积分
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (!profile || profile.credits < input.template.price_credits) {
    throw new Error('积分不足，请先购买积分');
  }

  // 2. 创建项目记录
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: input.projectName,
      status: 'draft',
      uploaded_photos: input.photos,
    })
    .select()
    .single();

  if (projectError || !project) {
    throw new Error('创建项目失败');
  }

  // 3. 创建生成记录
  const { data: generation, error: generationError } = await supabase
    .from('generations')
    .insert({
      project_id: project.id,
      user_id: userId,
      template_id: input.template.id,
      status: 'processing',
      credits_used: input.template.price_credits,
      is_shared_to_gallery: input.shareToGallery || false,
    })
    .select()
    .single();

  if (generationError || !generation) {
    throw new Error('创建生成记录失败');
  }

  const generationId = generation.id;

  onProgress({ stage: 'analyzing', progress: 20 });

  try {
    // 4. 扣除积分
    await supabase
      .from('profiles')
      .update({ credits: profile.credits - input.template.price_credits })
      .eq('id', userId);

    // 5. 构建 prompt
    const prompt = `${input.template.name}: ${input.template.description || ''} wedding portrait, high quality, cinematic lighting`;

    onProgress({ stage: 'generating', progress: 40 });

    // 6. 调用流式生成 API（参考 demo）
    const response = await fetch('/api/generate-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        prompt,
        image_inputs: input.photos.length > 0 ? [input.photos[0]] : undefined,
        model: 'gemini-2.5-flash-image',
      }),
    });

    if (!response.ok) {
      throw new Error(`生成失败: ${response.statusText}`);
    }

    // 7. 处理 SSE 流式响应（参考 demo 的逻辑）
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let content = '';
    let sseBuffer = '';

    onProgress({ stage: 'generating', progress: 60 });

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (sseBuffer.trim().length > 0) {
          sseBuffer += '\n\n';
        }
      } else {
        sseBuffer += decoder.decode(value, { stream: true });
      }

      // 按 SSE 事件边界拆分
      const events = sseBuffer.split(/\n\n/);
      sseBuffer = events.pop() || '';

      for (const evt of events) {
        const dataLines = evt
          .split(/\n/)
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trimStart());

        if (dataLines.length === 0) continue;
        const dataPayload = dataLines.join('\n').trim();
        if (dataPayload === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataPayload);
          if (parsed.choices?.[0]?.delta?.content) {
            content += parsed.choices[0].delta.content;
          }

          if (parsed.choices?.[0]?.finish_reason === 'stop') {
            break;
          }
        } catch (e) {
          // 忽略解析错误
        }
      }

      if (done) break;
    }

    onProgress({ stage: 'generating', progress: 80 });

    // 8. 从内容中提取图片（参考 demo）
    console.log('AI 响应内容长度:', content.length);
    console.log('AI 响应内容预览:', content.substring(0, 200));
    
    const base64ImageMatch = content.match(
      /!\[image\]\(data:\s*image\/([^;]+);\s*base64,\s*\n?([^)]+)\)/i
    );

    if (!base64ImageMatch) {
      console.error('未在AI响应中找到图片，内容:', content);
      
      // 使用占位图片作为回退（从用户上传的照片）
      console.log('AI服务未返回图片，使用上传的照片作为占位...');
      const placeholderImage = input.photos[0];
      
      // 更新数据库记录
      const { error: updateError } = await supabase
        .from('generations')
        .update({
          status: 'completed',
          preview_images: [placeholderImage],
          completed_at: new Date().toISOString(),
        })
        .eq('id', generationId);

      if (updateError) {
        console.error('更新生成记录失败:', updateError);
        throw new Error('保存生成结果失败');
      }

      console.log('已使用占位图片完成生成');
      onProgress({ stage: 'completed', progress: 100 });
      
      return {
        images: [placeholderImage],
        generationId,
      };
    }

    const imageType = base64ImageMatch[1];
    const base64String = base64ImageMatch[2].replace(/\s+/g, '');
    const imageUrl = `data:image/${imageType};base64,${base64String}`;

    onProgress({ stage: 'generating', progress: 90 });

    // 9. 将图片上传到对象存储，写入可访问 URL
    // 通过服务端 API 完成上传（Node 端调用 MinIO，避免在浏览器使用 SDK）
    let storedUrl = imageUrl;
    try {
      const uploadRes = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          image: imageUrl,
          folder: `generations/${generationId}/previews`,
        }),
      });

      if (uploadRes.ok) {
        const payload = await uploadRes.json();
        // 优先使用预签名URL（presignedUrl），24小时有效且可直接访问
        // publicUrl仅在MinIO配置了公共读策略且外网可访问时才能用
        storedUrl = payload.presignedUrl || payload.url || imageUrl;
      } else {
        // 上传失败则退化为直接使用 dataURL，避免中断流程
        console.warn('上传到对象存储失败，使用 dataURL 作为回退:', await uploadRes.text());
      }
    } catch (e) {
      console.warn('调用上传接口异常，使用 dataURL 回退:', e);
    }

    // 10. 更新数据库记录
    const { error: updateError } = await supabase
      .from('generations')
      .update({
        status: 'completed',
        preview_images: [storedUrl],
        completed_at: new Date().toISOString(),
      })
      .eq('id', generationId);

    if (updateError) {
      console.error('更新生成记录失败:', updateError);
      throw new Error('保存生成结果失败');
    }

    console.log('生成完成，图片已保存:', {
      generationId,
      imageUrl: storedUrl,
      imageSize: storedUrl.length
    });

    onProgress({ stage: 'completed', progress: 100 });

    return {
      images: [storedUrl],
      generationId,
    };

  } catch (error) {
    // 失败时退还积分并标记失败
    await supabase
      .from('profiles')
      .update({ credits: profile.credits })
      .eq('id', userId);

    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : '生成失败',
      })
      .eq('id', generationId);

    throw error;
  }
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
