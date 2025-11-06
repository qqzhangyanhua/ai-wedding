import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ImageGenerationSettings, GenerationState } from '@/components/GenerateSinglePage/types';
import type { ModelConfigSource } from '@/types/model-config';

interface UseStreamImageGenerationProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function useStreamImageGeneration({ onError, onSuccess }: UseStreamImageGenerationProps) {
  const { user } = useAuth();
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    generatedImage: null,
    streamingContent: '',
  });

  const buildFacePreservationPrompt = (level: ImageGenerationSettings['facePreservation']): string => {
    switch (level) {
      case 'high':
        return `STRICT REQUIREMENTS:
1. ABSOLUTELY preserve all facial features, facial contours, eye shape, nose shape, mouth shape, and all key characteristics from the original image
2. Maintain the person's basic facial structure and proportions COMPLETELY unchanged
3. Ensure the person in the edited image is 100% recognizable as the same individual
4. NO changes to any facial details including skin texture, moles, scars, or other distinctive features
5. If style conversion is involved, MUST maintain facial realism and accuracy
6. Focus ONLY on non-facial modifications as requested`;
      case 'medium':
        return `REQUIREMENTS:
1. Preserve the main facial features and facial contours from the original image
2. Maintain the person's basic facial structure and proportions
3. Ensure the person in the edited image is recognizable as the same individual
4. Allow minor facial detail adjustments but do not change overall characteristics
5. Prioritize facial preservation over stylistic changes`;
      case 'low':
        return `BASIC REQUIREMENTS:
1. Try to preserve the main facial features from the original image
2. Maintain the basic facial contours of the person
3. Allow some degree of facial adjustment and stylization while keeping general likeness`;
    }
  };

  const uploadGeneratedImageToMinio = async (
    imageDataUrl: string,
    originalImage: string,
    prompt: string,
    settings: ImageGenerationSettings
  ): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('未登录，跳过上传生成图片到 MinIO');
        return;
      }

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          image: imageDataUrl,
          folder: 'generate-single/results',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const resultImageUrl = result.presignedUrl || result.url || imageDataUrl;
        console.log('生成的图片已上传到 MinIO:', resultImageUrl);
        
        // 静默保存到数据库
        try {
          // 从 AuthContext 获取用户 ID（避免重复调用 API）
          if (!user?.id) {
            console.warn('用户未登录，跳过保存到数据库');
            return;
          }

          // 如果 originalImage 是 base64，需要先上传到 MinIO
          let originalImageUrl = originalImage;
          if (originalImage.startsWith('data:')) {
            console.log('原图是 base64，上传到 MinIO...');
            try {
              const uploadResponse = await fetch('/api/upload-image', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  image: originalImage,
                  folder: 'generate-single/uploads',
                }),
              });

              if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                originalImageUrl = uploadResult.presignedUrl || uploadResult.url || originalImage;
                console.log('原图已上传到 MinIO:', originalImageUrl);
              } else {
                console.warn('原图上传到 MinIO 失败，使用 base64');
              }
            } catch (uploadErr) {
              console.warn('原图上传到 MinIO 异常，使用 base64:', uploadErr);
            }
          }

          const { error: dbError } = await supabase
            .from('single_generations')
            .insert({
              user_id: user.id,  // 从 AuthContext 获取，避免额外 API 调用
              prompt: prompt,
              original_image: originalImageUrl,  // 使用 MinIO URL
              result_image: resultImageUrl,
              settings: {
                facePreservation: settings.facePreservation,
                creativityLevel: settings.creativityLevel,
              },
              credits_used: 15,
            });

          if (dbError) {
            console.warn('保存生成记录到数据库失败（不影响主流程）:', dbError);
          } else {
            console.log('生成记录已保存到数据库');
          }
        } catch (dbErr) {
          console.warn('保存生成记录异常（不影响主流程）:', dbErr);
        }

        onSuccess('图片生成完成并已保存！');
      } else {
        console.warn('上传生成图片到 MinIO 失败');
      }
    } catch (err) {
      console.warn('上传生成图片到 MinIO 异常:', err);
    }
  };

  const generateImage = async (
    originalImage: string,
    prompt: string,
    settings: ImageGenerationSettings,
    source?: ModelConfigSource
  ): Promise<void> => {
    onError('');
    onSuccess('');
    setGenerationState({
      isGenerating: true,
      generatedImage: null,
      streamingContent: '',
    });

    try {
      const facePreservationText = buildFacePreservationPrompt(settings.facePreservation);

      let enhancedPrompt = prompt;
      if (settings.facePreservation !== 'low') {
        enhancedPrompt = `Please edit the provided original image based on the following guidelines:

${facePreservationText}

SPECIFIC EDITING REQUEST: ${prompt}

Please focus your modifications ONLY on the user's specific requirements while strictly following the face preservation guidelines above. Generate a high-quality edited image that maintains facial identity.`;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('未登录，请先登录');
      }

      // 根据创意程度映射 temperature 和 top_p 参数
      let temperature = 0.2;
      let topP = 0.7;
      switch (settings.creativityLevel) {
        case 'balanced':
          temperature = 0.5;
          topP = 0.85;
          break;
        case 'creative':
          temperature = 0.8;
          topP = 0.95;
          break;
      }

      const response = await fetch('/api/generate-single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          image_inputs: [originalImage],
          model: 'gemini-2.5-flash-image',
          source: source,
          temperature: temperature,
          top_p: topP,
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let content = '';
      let sseBuffer = '';
      let processingCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (sseBuffer.trim().length > 0) {
            sseBuffer += '\n\n';
          }
        } else {
          sseBuffer += decoder.decode(value, { stream: true });
        }

        const events = sseBuffer.split(/\n\n/);
        sseBuffer = events.pop() || '';

        for (const evt of events) {
          const dataLines = evt
            .split(/\n/)
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).trimStart());

          if (dataLines.length === 0) continue;

          const dataPayload = dataLines.join('\n').trim();

          if (dataPayload === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(dataPayload);

            // 检查是否有错误
            if (parsed.error) {
              console.error('API返回错误:', parsed.error);
              const errorMsg = parsed.error.message || '未知错误';
              throw new Error(`API错误: ${errorMsg}`);
            }

            // 处理流式增量内容（delta）
            if (parsed.choices?.[0]?.delta) {
              const delta = parsed.choices[0].delta;

              // 1. 检查是否有图片数据（images数组）- OpenRouter 特有
              if (delta.images && Array.isArray(delta.images) && delta.images.length > 0) {
                console.log('检测到Delta中的images数组，长度:', delta.images.length);
                for (const img of delta.images) {
                  if (img.image_url?.url) {
                    console.log('找到图片URL，长度:', img.image_url.url.length);
                    content = img.image_url.url;
                    break;
                  }
                }
              }
              // 2. 处理文本内容
              else if (delta.content) {
                const deltaContent = delta.content;

                // 过滤掉 OPENROUTER PROCESSING 标记
                if (typeof deltaContent === 'string' && deltaContent.includes('OPENROUTER PROCESSING')) {
                  processingCount++;
                  console.log(`跳过 PROCESSING 标记 (${processingCount})`);
                  continue;
                }

                // 处理字符串类型的delta
                if (typeof deltaContent === 'string') {
                  content += deltaContent;
                  // 实时更新流式内容（不过滤 PROCESSING）
                  const cleanContent = content.replace(/:\s*OPENROUTER\s+PROCESSING\s*/gi, '').trim();
                  setGenerationState(prev => ({
                    ...prev,
                    streamingContent: cleanContent,
                  }));
                }
              }
            }

            // 处理完整的消息内容（message.content）- 通常在最后一个chunk
            if (parsed.choices?.[0]?.message?.content) {
              console.log('检测到完整消息内容');
              const messageContent = parsed.choices[0].message.content;

              // 如果是数组格式（包含图片数据）
              if (Array.isArray(messageContent)) {
                for (const item of messageContent) {
                  if (item.type === 'image' && item.source?.data) {
                    console.log('在Message中检测到图片数据，长度:', item.source.data.length);
                    // 保存为 JSON 字符串，后续解析
                    content = JSON.stringify({ content: messageContent });
                    break;
                  }
                }
              } else if (typeof messageContent === 'string') {
                content += messageContent;
              }
            }
          } catch (e) {
            console.warn('解析流式数据失败:', e);
          }
        }

        if (done) break;
      }

      // 清理最终内容（移除所有 PROCESSING 标记）
      const finalContent = content.replace(/:\s*OPENROUTER\s+PROCESSING\s*/gi, '').trim();
      console.log('流式接收完成，内容长度:', finalContent.length);
      console.log('PROCESSING标记出现次数:', processingCount);

      if (finalContent) {
        let imageDataUrl: string | null = null;

        // 1. 检查是否直接是 data URL 格式
        if (finalContent.startsWith('data:image/')) {
          const match = finalContent.match(/^data:image\/([^;]+);base64,(.+)$/);
          if (match) {
            const base64String = match[2];
            if (base64String.length >= 100) {
              imageDataUrl = finalContent;
              console.log('提取到直接的data URL格式图片');
            }
          }
        }

        // 2. 尝试解析 JSON 格式（数组格式的 content）
        if (!imageDataUrl) {
          try {
            const jsonData = JSON.parse(finalContent);
            if (jsonData.content && Array.isArray(jsonData.content)) {
              for (const item of jsonData.content) {
                if (item.type === 'image' && item.source?.data) {
                  const imageType = item.source.media_type?.split('/')[1] || 'png';
                  const base64String = item.source.data;
                  if (base64String.length >= 100) {
                    imageDataUrl = `data:${item.source.media_type || 'image/png'};base64,${base64String}`;
                    console.log('提取到JSON格式图片，类型:', imageType);
                    break;
                  }
                }
              }
            }
          } catch (e) {
            // 不是JSON格式，继续尝试Markdown格式
          }
        }

        // 3. 尝试 Markdown 格式（base64）
        if (!imageDataUrl) {
          const base64ImageMatch = finalContent.match(
            /!\[image\]\(data:\s*image\/([^;]+);\s*base64,\s*([^)]+)\)/i
          );
          if (base64ImageMatch) {
            const imageType = base64ImageMatch[1];
            const base64String = base64ImageMatch[2].replace(/\s+/g, '');
            if (base64String.length >= 100) {
              imageDataUrl = `data:image/${imageType};base64,${base64String}`;
              console.log('提取到Markdown格式图片，类型:', imageType);
            }
          }
        }

        // 4. 尝试 Markdown 格式（URL）- 302.ai 返回格式
        if (!imageDataUrl) {
          const urlImageMatch = finalContent.match(
            /!\[image\]\((https?:\/\/[^)]+)\)/i
          );
          if (urlImageMatch) {
            imageDataUrl = urlImageMatch[1];
            console.log('提取到 URL 格式图片:', imageDataUrl);
          }
        }

        if (imageDataUrl) {
          setGenerationState(prev => ({
            ...prev,
            generatedImage: imageDataUrl,
            isGenerating: false,
          }));
          onSuccess('图片生成完成！');

          // 只对 data URL 上传到 MinIO，HTTP URL 跳过
          if (imageDataUrl.startsWith('data:')) {
            await uploadGeneratedImageToMinio(imageDataUrl, originalImage, prompt, settings);
          } else {
            console.log('跳过 HTTP URL 图片的 MinIO 上传:', imageDataUrl);
          }
        } else {
          throw new Error('未能从响应中提取图片数据');
        }
      } else {
        throw new Error('API返回数据为空');
      }
    } catch (err) {
      console.error('生成图片失败:', err);
      onError(err instanceof Error ? err.message : '生成失败，请重试');
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
      }));
    }
  };

  const downloadImage = (): void => {
    if (!generationState.generatedImage) return;

    const link = document.createElement('a');
    link.href = generationState.generatedImage;
    link.download = `ai-wedding-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSuccess('图片下载成功！');
  };

  const copyBase64 = (): void => {
    if (!generationState.generatedImage) return;

    const base64String = generationState.generatedImage.split(',')[1];
    navigator.clipboard.writeText(base64String).then(() => {
      onSuccess('Base64数据已复制到剪贴板！');
    }).catch(() => {
      onError('复制失败');
    });
  };

  return {
    generationState,
    generateImage,
    downloadImage,
    copyBase64,
  };
}
