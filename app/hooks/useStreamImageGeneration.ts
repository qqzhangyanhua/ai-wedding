import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageGenerationSettings, GenerationState } from '@/components/GenerateSinglePage/types';

interface UseStreamImageGenerationProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function useStreamImageGeneration({ onError, onSuccess }: UseStreamImageGenerationProps) {
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

  const uploadGeneratedImageToMinio = async (imageDataUrl: string): Promise<void> => {
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
        console.log('生成的图片已上传到 MinIO:', result.url);
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
    settings: ImageGenerationSettings
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

      const response = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          image_inputs: [originalImage],
          model: 'gemini-2.5-flash-image',
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
            if (parsed.choices?.[0]?.delta?.content) {
              content += parsed.choices[0].delta.content;
              setGenerationState(prev => ({
                ...prev,
                streamingContent: content,
              }));
            }
          } catch (e) {
            console.warn('解析流式数据失败:', e);
          }
        }

        if (done) break;
      }

      if (content) {
        const base64ImageMatch = content.match(
          /!\[image\]\(data:\s*image\/([^;]+);\s*base64,\s*\n?([^)]+)\)/i
        );

        if (base64ImageMatch) {
          const imageType = base64ImageMatch[1];
          const base64String = base64ImageMatch[2].replace(/\s+/g, '');
          const imageDataUrl = `data:image/${imageType};base64,${base64String}`;

          setGenerationState(prev => ({
            ...prev,
            generatedImage: imageDataUrl,
            isGenerating: false,
          }));
          onSuccess('图片生成完成！');

          await uploadGeneratedImageToMinio(imageDataUrl);
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
