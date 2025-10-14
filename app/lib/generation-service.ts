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
import type { Template } from '@/types/database';

/**
 * 从模板计算本次生成所用的提示词列表
 * 优先顺序：template.prompt_list -> template.prompt_config.basePrompt -> template.description/name
 */
function getPromptsFromTemplate(template: Template): string[] {
  const list = Array.isArray(template.prompt_list) ? template.prompt_list.filter(Boolean) : [];
  if (list.length > 0) return list;
  const base = template.prompt_config?.basePrompt?.trim();
  if (base) return [base];
  const fallback = (template.description || template.name || '').trim();
  return fallback ? [fallback] : ['beautiful wedding portrait'];
}

/**
 * 组合最终 prompt - 完全采用成功案例的格式
 * 关键点：
 * 1. 使用 "EDIT" 而非 "CREATE" - 强调基于原图修改
 * 2. "EDITING REQUEST" 而非 "SCENE REQUEST" - 明确是编辑任务
 * 3. 结尾再次强调 "maintains facial identity"
 * 4. 移除 Style、Quality、Avoid 等分散注意力的部分
 * 5. 保持 prompt 简洁、聚焦
 */
function composePrompt(template: Template, base: string): string {
  const MAX_LENGTH = 1400; // 给 API 留有余地（验证限制 1500）

  // 使用成功案例中证明有效的 STRICT REQUIREMENTS 格式
  const FACE_PRESERVATION = `STRICT REQUIREMENTS:
1. ABSOLUTELY preserve all facial features, facial contours, eye shape, nose shape, mouth shape, and all key characteristics from the original image
2. Maintain the person's basic facial structure and proportions COMPLETELY unchanged
3. Ensure the person in the edited image is 100% recognizable as the same individual
4. NO changes to any facial details including skin texture, moles, scars, or other distinctive features
5. If style conversion is involved, MUST maintain facial realism and accuracy
6. Focus ONLY on non-facial modifications as requested`;

  // 简洁的结尾，再次强调人脸保持
  const CLOSING = `Please focus your modifications ONLY on the user's specific requirements while strictly following the face preservation guidelines above. Generate a high-quality edited image that maintains facial identity.`;

  // 计算可用长度（不再包含 Style、Quality、Avoid）
  const fixedOverhead = `Please edit the provided original image based on the following guidelines:\n\n${FACE_PRESERVATION}\n\nSPECIFIC EDITING REQUEST: \n\n${CLOSING}`.length;
  const availableForBase = MAX_LENGTH - fixedOverhead - 30; // 留 30 字符余量

  // 如果 base 超长，智能截断
  let finalBase = base;
  if (base.length > availableForBase) {
    console.warn(`Prompt base 过长 (${base.length} 字符)，截断至 ${availableForBase} 字符`);
    finalBase = base.substring(0, availableForBase) + '...';
  }

  // 完全按照成功案例的格式组装
  const result = `Please edit the provided original image based on the following guidelines:

${FACE_PRESERVATION}

SPECIFIC EDITING REQUEST: ${finalBase}

${CLOSING}`;

  // 最终兜底检查
  if (result.length > MAX_LENGTH) {
    const emergencyBase = finalBase.substring(0, Math.max(100, availableForBase - 200)) + '...';
    return `Please edit the provided original image based on the following guidelines:

${FACE_PRESERVATION}

SPECIFIC EDITING REQUEST: ${emergencyBase}

${CLOSING}`;
  }

  return result;
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

  // 使用 mock 生成器：按提示词数生成多张
  const prompts = getPromptsFromTemplate(input.template);
  const images = await mockGenerateImages({
    input: input.photos[0],
    variants: Math.max(1, Math.min(8, prompts.length)),
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

    // 5. 计算提示词集合，并逐条生成
    const prompts = getPromptsFromTemplate(input.template);
    const total = Math.max(1, Math.min(8, prompts.length));

    onProgress({ stage: 'generating', progress: 40 });

    const storedUrls: string[] = [];

    for (let i = 0; i < total; i++) {
      try {
        const variantPrompt = prompts[i] || (input.template.description || input.template.name || 'wedding');
        // 改为将原始 prompt（来源于 prompt_list/basePrompt/description）直接传给后端
        // 后端 /api/generate-stream 会参考 demo 模板进行优化与包裹
        const rawPrompt = variantPrompt;

        // 6. 调用流式生成 API（逐条）
        const response = await fetch('/api/generate-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt: rawPrompt,
            image_inputs: input.photos.length > 0 ? [input.photos[0]] : undefined,
            model: 'gemini-2.5-flash-image',
          }),
        });

        if (!response.ok) {
          console.warn(`第 ${i + 1} 条提示词生成失败: ${response.statusText}`);
          continue; // 跳过失败，继续下一个
        }

        // 7. 处理 SSE 流式响应
        const reader = response.body?.getReader();
        if (!reader) {
          console.warn(`第 ${i + 1} 条提示词生成失败：无法获取响应流`);
          continue;
        }

        const decoder = new TextDecoder();
        let content = '';
        let sseBuffer = '';

        // 循环内推进部分进度（60 左右）
        onProgress({ stage: 'generating', progress: 55 });

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
            } catch {
              // 忽略解析错误
            }
          }

          if (done) break;
        }

        onProgress({ stage: 'generating', progress: 70 });

        // 8. 从内容中提取图片
        const base64ImageMatch = content.match(
          /!\[image\]\(data:\s*image\/([^;]+);\s*base64,\s*\n?([^)]+)\)/i
        );

        let imageUrl = '';
        if (!base64ImageMatch) {
          console.warn(`第 ${i + 1} 条提示词：未在AI响应中找到图片，使用上传的照片作为占位`);
          imageUrl = input.photos[0];
        } else {
          const imageType = base64ImageMatch[1];
          const base64String = base64ImageMatch[2].replace(/\s+/g, '');
          imageUrl = `data:image/${imageType};base64,${base64String}`;
        }

        onProgress({ stage: 'generating', progress: 80 });

        // 9. 上传到对象存储
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
            storedUrl = payload.presignedUrl || payload.url || imageUrl;
          } else {
            console.warn(`第 ${i + 1} 条提示词上传失败，使用 dataURL 回退:`, await uploadRes.text());
          }
        } catch (e) {
          console.warn(`第 ${i + 1} 条提示词调用上传接口异常，使用 dataURL 回退:`, e);
        }

        storedUrls.push(storedUrl);

      } catch (e) {
        console.warn(`第 ${i + 1} 条提示词生成异常，已跳过:`, e);
      } finally {
        // 循环内推进阶段性进度（90 左右），按比例分配
        const ratio = Math.min(1, (i + 1) / total);
        const prog = 60 + Math.floor(ratio * 30); // 60-90
        onProgress({ stage: 'generating', progress: prog });
      }
    }

    // 10. 若全部失败则回滚（抛错触发外层 catch 退款与失败标记）；否则更新完成
    if (storedUrls.length === 0) {
      throw new Error('所有提示词均生成失败');
    }

    const { error: updateError } = await supabase
      .from('generations')
      .update({
        status: 'completed',
        preview_images: storedUrls,
        completed_at: new Date().toISOString(),
      })
      .eq('id', generationId);

    if (updateError) {
      console.error('更新生成记录失败:', updateError);
      throw new Error('保存生成结果失败');
    }

    onProgress({ stage: 'completed', progress: 100 });

    return {
      images: storedUrls,
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
