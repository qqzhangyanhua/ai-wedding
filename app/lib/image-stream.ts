/**
 * 流式图片生成 API 封装
 * 参考 example/image-edit-demo.html 实现
 */

import { supabase } from '@/lib/supabase';
import type { StreamImageOptions, StreamImageResult } from '@/types/image';

/**
 * 调用流式图片生成 API
 */
export async function generateImageStream(
  options: StreamImageOptions
): Promise<StreamImageResult> {
  const {
    prompt,
    imageInputs,
    n,
    model,
    onProgress,
    onStatus,
  } = options;

  onStatus?.('connecting');

  // 从 Supabase 获取会话 token
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    onStatus?.('error');
    throw new Error('未登录或会话已过期');
  }

  // 构建请求体
  const requestBody = {
    prompt,
    image_inputs: imageInputs,
    n,
    model,
  };

  // 调用我们的 API 路由（避免暴露 API Key）
  const response = await fetch('/api/generate-stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    onStatus?.('error');
    throw new Error(
      `API请求失败: ${response.status} ${response.statusText}`
    );
  }

  onStatus?.('streaming');

  // 处理流式响应
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法获取响应流');
  }

  const decoder = new TextDecoder();
  let content = '';
  let sseBuffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // 读完后尝试处理缓冲中剩余的完整事件
        if (sseBuffer.trim().length > 0) {
          sseBuffer += '\n\n';
        }
      } else {
        // 按流式追加解码，保留不完整尾部
        sseBuffer += decoder.decode(value, { stream: true });
      }

      // 按 SSE 事件边界（空行）拆分
      const events = sseBuffer.split(/\n\n/);
      // 最后一段可能是不完整事件，留下给下一轮
      sseBuffer = events.pop() || '';

      for (const evt of events) {
        // 支持多行 data: 情况，将所有 data: 行拼接
        const dataLines = evt
          .split(/\n/)
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trimStart());

        if (dataLines.length === 0) continue;

        // 多 data: 行按换行合并（SSE 规范）
        const dataPayload = dataLines.join('\n').trim();

        if (dataPayload === '[DONE]') {
          continue;
        }

        try {
          const parsed = JSON.parse(dataPayload);
          if (
            parsed.choices &&
            parsed.choices[0] &&
            parsed.choices[0].delta &&
            parsed.choices[0].delta.content
          ) {
            content += parsed.choices[0].delta.content;
            // 实时更新显示内容
            onProgress?.(content);
          }

          // 检查是否流式结束
          if (
            parsed.choices &&
            parsed.choices[0] &&
            parsed.choices[0].finish_reason === 'stop'
          ) {
            break;
          }
        } catch (e) {
          console.warn('解析流式数据失败，已忽略该事件:', e);
        }
      }

      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }

  onStatus?.('parsing');

  // 解析图片数据
  const imageData = parseImageFromContent(content);

  onStatus?.('completed');

  return {
    content,
    imageData,
  };
}

/**
 * 从返回内容中提取图片数据
 */
function parseImageFromContent(content: string): StreamImageResult['imageData'] {
  // 匹配 Markdown 格式的 base64 图片
  const base64ImageMatch = content.match(
    /!\[image\]\(data:\s*image\/([^;]+);\s*base64,\s*\n?([^)]+)\)/i
  );

  if (base64ImageMatch) {
    const imageType = base64ImageMatch[1];
    const base64String = base64ImageMatch[2].replace(/\s+/g, '');
    const dataUrl = `data:image/${imageType};base64,${base64String}`;

    return {
      type: imageType,
      base64: base64String,
      dataUrl,
    };
  }

  return undefined;
}
