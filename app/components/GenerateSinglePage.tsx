"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, Sparkles, Wand2, Download, Copy, AlertCircle, CheckCircle, Loader2, Image as ImageIcon, Maximize2, X, Info } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { Template } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { CardSkeleton } from './ui/card-skeleton';
import { supabase } from '@/lib/supabase';
import { useImageIdentification } from '@/hooks/useImageIdentification';

interface ImageGenerationSettings {
  facePreservation: 'high' | 'medium' | 'low';
  creativityLevel: 'conservative' | 'balanced' | 'creative';
}

export function GenerateSinglePage() {
  const { user } = useAuth();
  const { templates, loading: templatesLoading } = useTemplates();
  const { identifyImages, isIdentifying } = useImageIdentification();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // 图片上传相关
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null); // MinIO URL
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  
  // 模板和提示词
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(0);
  const [customPrompt, setCustomPrompt] = useState('');
  
  // 生成设置
  const [settings, setSettings] = useState<ImageGenerationSettings>({
    facePreservation: 'high',
    creativityLevel: 'conservative'
  });
  
  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 图片预览
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  // 文件选择处理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件！');
      return;
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('图片文件不能超过10MB！');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsValidatingImage(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      
      try {
        // 检查用户是否登录
        if (!user) {
          // 未登录用户，跳过识别
          setOriginalImage(dataUrl);
          setOriginalImageFile(file);
          setIsValidatingImage(false);
          return;
        }

        // 调用识别接口验证图片是否包含人物
        const identifyResult = await identifyImages([dataUrl]);
        
        if (!identifyResult.allValid) {
          // 图片不包含人物
          const invalidResult = identifyResult.results.find(r => !r.hasPerson);
          setError(
            `检测到图片未包含人物：${invalidResult?.description || '请上传包含人物的照片'}。\n请重新选择包含人物的照片。`
          );
          setIsValidatingImage(false);
          return;
        }

        // 验证通过，设置图片
        setOriginalImage(dataUrl);
        setOriginalImageFile(file);
        setSuccess('图片验证通过！');
        
        // 上传到 MinIO
        await uploadImageToMinio(dataUrl);
        
      } catch (err) {
        console.error('图片验证失败:', err);
        setError(err instanceof Error ? err.message : '图片验证失败，请重试');
      } finally {
        setIsValidatingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // 上传图片到 MinIO
  const uploadImageToMinio = async (dataUrl: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('未登录，跳过上传到 MinIO');
        return;
      }

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          image: dataUrl,
          folder: 'generate-single/uploads',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setUploadedImageUrl(result.presignedUrl || result.url);
        console.log('图片已上传到 MinIO:', result.url);
      } else {
        console.warn('上传到 MinIO 失败，将使用 dataURL');
      }
    } catch (err) {
      console.warn('上传到 MinIO 异常:', err);
    }
  };

  // 处理模板选择
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setSelectedPromptIndex(0); // 重置提示词索引
    setCustomPrompt(''); // 清空自定义提示词
  };

  // 获取当前使用的提示词
  const getCurrentPrompt = (): string => {
    if (selectedTemplate) {
      // 如果模板有 prompt_list，使用选中的提示词
      if (selectedTemplate.prompt_list && selectedTemplate.prompt_list.length > 0) {
        return selectedTemplate.prompt_list[selectedPromptIndex] || selectedTemplate.prompt_list[0];
      }
      // 否则使用 basePrompt
      const promptConfig = typeof selectedTemplate.prompt_config === 'string' 
        ? JSON.parse(selectedTemplate.prompt_config) 
        : selectedTemplate.prompt_config;
      return promptConfig.basePrompt || '';
    }
    return customPrompt.trim();
  };

  // 生成图片
  const generateImage = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const currentPrompt = getCurrentPrompt();
    if (!originalImage || !currentPrompt) {
      setError('请上传图片并选择模板/提示词或输入自定义提示词！');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsGenerating(true);
    setGeneratedImage(null);
    setStreamingContent('');

    try {
      // 构建提示词
      let facePreservationText = '';
      switch (settings.facePreservation) {
        case 'high':
          facePreservationText = `STRICT REQUIREMENTS:
1. ABSOLUTELY preserve all facial features, facial contours, eye shape, nose shape, mouth shape, and all key characteristics from the original image
2. Maintain the person's basic facial structure and proportions COMPLETELY unchanged
3. Ensure the person in the edited image is 100% recognizable as the same individual
4. NO changes to any facial details including skin texture, moles, scars, or other distinctive features
5. If style conversion is involved, MUST maintain facial realism and accuracy
6. Focus ONLY on non-facial modifications as requested`;
          break;
        case 'medium':
          facePreservationText = `REQUIREMENTS:
1. Preserve the main facial features and facial contours from the original image
2. Maintain the person's basic facial structure and proportions
3. Ensure the person in the edited image is recognizable as the same individual
4. Allow minor facial detail adjustments but do not change overall characteristics
5. Prioritize facial preservation over stylistic changes`;
          break;
        case 'low':
          facePreservationText = `BASIC REQUIREMENTS:
1. Try to preserve the main facial features from the original image
2. Maintain the basic facial contours of the person
3. Allow some degree of facial adjustment and stylization while keeping general likeness`;
          break;
      }

      // 获取当前使用的提示词
      const basePrompt = getCurrentPrompt();

      // 构建增强的提示词（根据五官保持强度）
      let enhancedPrompt = basePrompt;
      
      // 如果用户选择了五官保持，添加相应的指令
      if (settings.facePreservation !== 'low') {
        enhancedPrompt = `Please edit the provided original image based on the following guidelines:

${facePreservationText}

SPECIFIC EDITING REQUEST: ${basePrompt}

Please focus your modifications ONLY on the user's specific requirements while strictly following the face preservation guidelines above. Generate a high-quality edited image that maintains facial identity.`;
      }

      // 获取 Supabase session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('未登录，请先登录');
      }

      // 调用 /api/generate-stream 接口
      const response = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          image_inputs: [originalImage], // 传递 data URL
          model: 'gemini-2.5-flash-image',
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      // 处理流式响应
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
              setStreamingContent(content);
            }
          } catch (e) {
            console.warn('解析流式数据失败:', e);
          }
        }

        if (done) break;
      }

      if (content) {
        // 解析生成的图片
        const base64ImageMatch = content.match(
          /!\[image\]\(data:\s*image\/([^;]+);\s*base64,\s*\n?([^)]+)\)/i
        );

        if (base64ImageMatch) {
          const imageType = base64ImageMatch[1];
          const base64String = base64ImageMatch[2].replace(/\s+/g, '');
          const imageDataUrl = `data:image/${imageType};base64,${base64String}`;
          setGeneratedImage(imageDataUrl);
          setSuccess('图片生成完成！');

          // 上传生成的图片到 MinIO
          await uploadGeneratedImageToMinio(imageDataUrl);
        } else {
          throw new Error('未能从响应中提取图片数据');
        }
      } else {
        throw new Error('API返回数据为空');
      }
    } catch (err) {
      console.error('生成图片失败:', err);
      setError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 上传生成的图片到 MinIO
  const uploadGeneratedImageToMinio = async (imageDataUrl: string) => {
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
        setSuccess('图片生成完成并已保存！');
      } else {
        console.warn('上传生成图片到 MinIO 失败');
      }
    } catch (err) {
      console.warn('上传生成图片到 MinIO 异常:', err);
    }
  };

  // 下载图片
  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-wedding-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccess('图片下载成功！');
  };

  // 复制Base64
  const copyBase64 = () => {
    if (!generatedImage) return;

    const base64String = generatedImage.split(',')[1];
    navigator.clipboard.writeText(base64String).then(() => {
      setSuccess('Base64数据已复制到剪贴板！');
    }).catch(() => {
      setError('复制失败');
    });
  };

  // 查看大图
  const viewImage = (imageUrl: string, title: string) => {
    setPreviewImage(imageUrl);
    setPreviewTitle(title);
  };

  // 关闭预览
  const closePreview = () => {
    setPreviewImage(null);
    setPreviewTitle('');
  };

  return (
    <div className="py-12 min-h-screen bg-gradient-to-b from-champagne via-ivory to-blush">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* 标题 */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-champagne border border-rose-gold/20 text-navy rounded-full text-sm font-medium tracking-wide shadow-sm mb-6">
            <Wand2 className="w-4 h-4 text-rose-gold" />
            AI 图片生成
          </div>
          <h1 className="mb-4 text-4xl font-medium md:text-5xl font-display text-navy">
            生成全新的
            <span className="text-dusty-rose"> 梦幻婚纱照</span>
          </h1>
          <p className="mb-6 text-xl text-stone">上传照片，选择风格，AI智能生成专属婚纱照</p>

          {/* 温馨提示 */}
        
        </div>

        <div className="grid grid-cols-1 gap-8 mb-8 lg:grid-cols-2">
          {/* 左侧：上传区域 */}
          <div className="p-6 rounded-xl border shadow-sm bg-ivory border-stone/10">
            <h2 className="flex gap-2 items-center mb-4 text-xl font-medium font-display text-navy">
              <Upload className="w-5 h-5 text-rose-gold" />
              上传原图
            </h2>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? 'border-rose-gold bg-rose-gold/5'
                  : 'border-stone/30 hover:border-rose-gold/50 hover:bg-champagne/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {originalImage ? (
                <div className="space-y-4">
                  <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden group">
                    <Image
                      src={originalImage}
                      alt="原图预览"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => viewImage(originalImage, '原图')}
                      className="flex absolute inset-0 justify-center items-center opacity-0 transition-opacity duration-300 bg-black/50 group-hover:opacity-100"
                    >
                      <div className="p-3 rounded-full bg-ivory/90">
                        <Maximize2 className="w-6 h-6 text-navy" />
                      </div>
                    </button>
                  </div>
                  {originalImageFile && (
                    <div className="space-y-1 text-sm text-stone">
                      <p><span className="font-medium">文件名:</span> {originalImageFile.name}</p>
                      <p><span className="font-medium">大小:</span> {(originalImageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </div>
              ) : isValidatingImage ? (
                <div className="space-y-4">
                  <Loader2 className="mx-auto w-12 h-12 animate-spin text-rose-gold" />
                  <div>
                    <p className="mb-2 text-lg font-medium text-navy">正在验证图片...</p>
                    <p className="text-sm text-stone">检测图片是否包含人物</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center items-center mx-auto w-16 h-16 rounded-full bg-champagne">
                    <ImageIcon className="w-8 h-8 text-rose-gold" />
                  </div>
                  <div>
                    <p className="mb-2 text-lg font-medium text-navy">点击或拖拽上传图片</p>
                    <p className="text-sm text-stone">支持 JPG, PNG, WebP 格式，最大 10MB</p>
                    {user && (
                      <p className="mt-2 text-xs text-stone/70">上传后将自动验证图片是否包含人物</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* 验证状态提示 */}
            {user && originalImage && !isValidatingImage && (
              <div className="flex gap-2 items-start p-3 mt-4 bg-green-50 rounded-md border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">图片验证通过</p>
                  <p>已检测到人物，可以继续生成</p>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：结果区域 */}
          <div className="p-6 rounded-xl border shadow-sm bg-ivory border-stone/10">
            <h2 className="flex gap-2 items-center mb-4 text-xl font-medium font-display text-navy">
              <Sparkles className="w-5 h-5 text-rose-gold" />
              生成结果
            </h2>
            
            <div className="border-2 border-dashed border-stone/30 rounded-xl p-8 min-h-[400px] flex items-center justify-center">
              {isGenerating ? (
                <div className="space-y-4 text-center">
                  <Loader2 className="mx-auto w-12 h-12 animate-spin text-rose-gold" />
                  <p className="text-stone">AI正在生成中，请稍候...</p>
                  {streamingContent && (
                    <p className="text-xs text-stone/70">已接收 {streamingContent.length} 字符</p>
                  )}
                </div>
              ) : generatedImage ? (
                <div className="space-y-4 w-full">
                  <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden group">
                    <Image
                      src={generatedImage}
                      alt="生成的图片"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => viewImage(generatedImage, '生成结果')}
                      className="flex absolute inset-0 justify-center items-center opacity-0 transition-opacity duration-300 bg-black/50 group-hover:opacity-100"
                    >
                      <div className="p-3 rounded-full bg-ivory/90">
                        <Maximize2 className="w-6 h-6 text-navy" />
                      </div>
                    </button>
                  </div>

                  {/* 重要提示 */}
                  <div className="flex gap-2 items-start p-3 bg-amber-50 rounded-md border border-amber-200">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="mb-1 font-medium">重要提示</p>
                      <p>图片满意请及时下载保存，本页面不会自动储存您的生成结果。</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={downloadImage}
                      className="flex flex-1 gap-2 justify-center items-center px-4 py-3 font-medium rounded-md transition-colors bg-navy text-ivory hover:bg-navy/90"
                    >
                      <Download className="w-4 h-4" />
                      下载图片
                    </button>
                    <button
                      onClick={copyBase64}
                      className="flex flex-1 gap-2 justify-center items-center px-4 py-3 font-medium rounded-md transition-colors bg-rose-gold/20 text-navy hover:bg-rose-gold/30"
                    >
                      <Copy className="w-4 h-4" />
                      复制Base64
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-stone">
                  <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 rounded-full bg-champagne">
                    <Sparkles className="w-8 h-8 text-rose-gold" />
                  </div>
                  <p>生成的图片将在这里显示</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 模板选择 */}
        <div className="p-6 mb-8 rounded-xl border shadow-sm bg-ivory border-stone/10">
          <h2 className="mb-4 text-xl font-medium font-display text-navy">选择风格模板（可选）</h2>
          
          {templatesLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} aspectClass="aspect-[3/4]" lines={1} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {templates.slice(0, 12).map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    selectedTemplate?.id === template.id
                      ? 'border-rose-gold shadow-lg scale-105'
                      : 'border-stone/20 hover:border-rose-gold/50 hover:shadow-md'
                  }`}
                >
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={template.preview_image_url}
                      alt={template.name}
                      fill
                      className="object-cover"
                    />
                    {selectedTemplate?.id === template.id && (
                      <div className="flex absolute inset-0 justify-center items-center bg-rose-gold/20">
                        <div className="flex justify-center items-center w-10 h-10 rounded-full bg-rose-gold">
                          <CheckCircle className="w-6 h-6 text-ivory" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-ivory">
                    <p className="text-xs font-medium truncate text-navy">{template.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 提示词列表选择 */}
          {selectedTemplate && selectedTemplate.prompt_list && selectedTemplate.prompt_list.length > 0 && (
            <div className="pt-6 mt-6 border-t border-stone/20">
              <h3 className="flex gap-2 items-center mb-4 text-lg font-medium font-display text-navy">
                <Sparkles className="w-5 h-5 text-rose-gold" />
                选择提示词风格
                <span className="text-sm font-normal text-stone">（{selectedTemplate.prompt_list.length} 个可选）</span>
              </h3>
              <div className="space-y-3">
                {selectedTemplate.prompt_list.map((prompt, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPromptIndex(index)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      selectedPromptIndex === index
                        ? 'border-rose-gold bg-rose-gold/5 shadow-sm'
                        : 'border-stone/20 hover:border-rose-gold/50 hover:bg-champagne/30'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                        selectedPromptIndex === index
                          ? 'border-rose-gold bg-rose-gold'
                          : 'border-stone/30'
                      }`}>
                        {selectedPromptIndex === index && (
                          <CheckCircle className="w-4 h-4 text-ivory" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-2 items-center mb-2">
                          <span className={`text-sm font-medium ${
                            selectedPromptIndex === index ? 'text-rose-gold' : 'text-navy'
                          }`}>
                            风格 {index + 1}
                          </span>
                          {selectedPromptIndex === index && (
                            <span className="px-2 py-0.5 bg-rose-gold/20 text-rose-gold text-xs rounded-full font-medium">
                              已选择
                            </span>
                          )}
                        </div>
                        <p className={`text-sm leading-relaxed ${
                          selectedPromptIndex === index ? 'text-navy' : 'text-stone'
                        }`}>
                          {prompt}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 提示词和设置 */}
        <div className="p-6 mb-8 rounded-xl border shadow-sm bg-ivory border-stone/10">
          <h2 className="mb-4 text-xl font-medium font-display text-navy">生成设置</h2>
          
          {/* 自定义提示词 */}
          <div className="mb-6">
            <label className="block flex gap-2 items-center mb-2 text-sm font-medium text-navy">
              自定义提示词（英文，可选）
              {!selectedTemplate && (
                <span className="text-xs font-normal text-stone">未选择模板时可用</span>
              )}
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => {
                setCustomPrompt(e.target.value);
                // 输入自定义提示词时清除模板选择
                if (e.target.value.trim() && selectedTemplate) {
                  setSelectedTemplate(null);
                  setSelectedPromptIndex(0);
                }
              }}
              placeholder="例如: Generate a romantic wedding photo in a dreamy sunset beach with soft pink sky and ocean waves..."
              className="w-full px-4 py-3 border border-stone/20 rounded-md focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose transition-all resize-vertical min-h-[120px] disabled:bg-stone/5 disabled:cursor-not-allowed"
              disabled={!!selectedTemplate}
            />
            {selectedTemplate ? (
              <div className="flex gap-2 items-start p-3 mt-2 rounded-md border bg-rose-gold/5 border-rose-gold/20">
                <Sparkles className="w-4 h-4 text-rose-gold flex-shrink-0 mt-0.5" />
                <p className="text-xs text-navy">
                  已选择模板 <span className="font-medium">{selectedTemplate.name}</span>
                  {selectedTemplate.prompt_list && selectedTemplate.prompt_list.length > 0 && (
                    <span> - 风格 {selectedPromptIndex + 1}</span>
                  )}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-stone/70">
                💡 提示：可以选择上方的模板，或在此输入自定义提示词
              </p>
            )}
          </div>

          {/* 高级设置 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-2 text-sm font-medium text-navy">
                五官保持强度
              </label>
              <select
                value={settings.facePreservation}
                onChange={(e) => setSettings({ ...settings, facePreservation: e.target.value as ImageGenerationSettings['facePreservation'] })}
                className="px-4 py-3 w-full rounded-md border transition-all border-stone/20 focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose"
              >
                <option value="high">高（推荐）</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-navy">
                创意程度
              </label>
              <select
                value={settings.creativityLevel}
                onChange={(e) => setSettings({ ...settings, creativityLevel: e.target.value as ImageGenerationSettings['creativityLevel'] })}
                className="px-4 py-3 w-full rounded-md border transition-all border-stone/20 focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose"
              >
                <option value="conservative">保守（推荐）</option>
                <option value="balanced">平衡</option>
                <option value="creative">创意</option>
              </select>
            </div>
          </div>
        </div>

        {/* 生成按钮 */}
        <div className="text-center">
          <button
            onClick={generateImage}
            disabled={!originalImage || !getCurrentPrompt() || isGenerating}
            className="flex gap-3 items-center px-12 py-4 mx-auto text-lg font-medium bg-gradient-to-r rounded-md transition-all duration-300 from-rose-gold to-dusty-rose text-ivory hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                开始AI生成
              </>
            )}
          </button>
          {!getCurrentPrompt() && originalImage && (
            <p className="mt-3 text-sm text-stone">
              请选择模板风格或输入自定义提示词
            </p>
          )}
        </div>

        {/* 错误和成功提示 */}
        {error && (
          <div className="flex gap-3 items-start p-4 mt-6 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex gap-3 items-start p-4 mt-6 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-700">{success}</p>
          </div>
        )}
      </div>

      {/* 图片预览弹窗 */}
      {previewImage && (
        <div
          className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/90"
          onClick={closePreview}
        >
          <div className="flex relative flex-col w-full max-w-7xl h-full">
            {/* 顶部标题栏 */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-medium font-display text-ivory">{previewTitle}</h3>
              <button
                onClick={closePreview}
                className="p-2 rounded-full transition-colors bg-ivory/10 hover:bg-ivory/20"
              >
                <X className="w-6 h-6 text-ivory" />
              </button>
            </div>

            {/* 图片容器 */}
            <div
              className="overflow-hidden relative flex-1 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={previewImage}
                alt={previewTitle}
                fill
                className="object-contain"
                quality={100}
              />
            </div>

            {/* 底部操作栏 */}
            <div className="flex gap-3 justify-center mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement('a');
                  link.href = previewImage;
                  link.download = `${previewTitle}-${Date.now()}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex gap-2 items-center px-6 py-3 font-medium rounded-md transition-colors bg-ivory text-navy hover:bg-ivory/90"
              >
                <Download className="w-4 h-4" />
                下载图片
              </button>
              {previewTitle === '生成结果' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyBase64();
                  }}
                  className="flex gap-2 items-center px-6 py-3 font-medium rounded-md transition-colors bg-ivory/20 text-ivory hover:bg-ivory/30"
                >
                  <Copy className="w-4 h-4" />
                  复制Base64
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

