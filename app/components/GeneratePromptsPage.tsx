"use client";

import { useState, useRef } from 'react';
import { Sparkles, Upload, Loader2, AlertCircle, CheckCircle, Wand2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { usePromptGeneration } from '@/hooks/usePromptGeneration';
import Image from 'next/image';

export function GeneratePromptsPage() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isGenerating, prompts, generatePrompts, clearPrompts } = usePromptGeneration();

  const handleFileSelect = async (file: File): Promise<void> => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setError(null);
    setSuccess(null);

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }

    // 验证文件大小（最大 10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过 10MB');
      return;
    }

    try {
      // 转换为 base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setUploadedImage(base64);
        clearPrompts();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('图片读取失败，请重试');
    }
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (): void => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleGenerate = async (): Promise<void> => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!uploadedImage) {
      setError('请先上传图片');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await generatePrompts(uploadedImage);
      setSuccess('成功生成 5 个风格方案！');
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败，请重试';
      setError(message);
    }
  };

  const handleUsePrompt = (prompt: string): void => {
    // 新窗口打开 generate-single 页面，并传递提示词
    const encodedPrompt = encodeURIComponent(prompt);
    window.open(`/generate-single?prompt=${encodedPrompt}`, '_blank');
  };

  return (
    <div className="py-12 min-h-screen bg-gradient-to-b from-champagne via-ivory to-blush">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-champagne border border-rose-gold/20 text-navy rounded-full text-sm font-medium tracking-wide shadow-sm mb-6">
            <Sparkles className="w-4 h-4 text-rose-gold" />
            AI 风格定制
          </div>
          <h1 className="mb-4 text-4xl font-medium md:text-5xl font-display text-navy">
            智能生成
            <span className="text-dusty-rose"> 婚纱照风格方案</span>
          </h1>
          <p className="mb-6 text-xl text-stone">
            上传参考图片，AI 为您生成 5 个专业的婚纱照风格方案
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* 左侧：图片上传 */}
          <div className="space-y-6">
            <div className="p-8 rounded-xl border shadow-sm backdrop-blur-md bg-ivory/50 border-stone/10">
              <h2 className="mb-4 text-2xl font-medium font-display text-navy">上传参考图片</h2>
              <p className="mb-6 text-sm text-stone">
                上传一张您喜欢的婚纱照风格图片，AI 将分析并生成相似风格的拍摄方案
              </p>

              {/* 上传区域 */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  isDragging
                    ? 'border-rose-gold bg-rose-gold/10'
                    : 'border-stone/30 hover:border-rose-gold/50'
                } ${uploadedImage ? 'bg-champagne/30' : 'bg-ivory'}`}
              >
                {uploadedImage ? (
                  <div className="space-y-4">
                    <div className="relative w-full h-64 rounded-lg overflow-hidden">
                      <Image
                        src={uploadedImage}
                        alt="上传的图片"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setUploadedImage(null);
                        clearPrompts();
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="px-4 py-2 text-sm text-dusty-rose hover:text-rose-gold transition-colors"
                    >
                      重新上传
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-stone/50" />
                    <p className="mb-2 text-lg font-medium text-navy">
                      拖拽图片到这里，或点击上传
                    </p>
                    <p className="mb-4 text-sm text-stone">支持 JPG、PNG 格式，最大 10MB</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 bg-navy text-ivory rounded-md hover:bg-navy/90 transition-colors"
                    >
                      选择图片
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                  </>
                )}
              </div>

              {/* 生成按钮 */}
              <button
                onClick={handleGenerate}
                disabled={!uploadedImage || isGenerating}
                className="w-full mt-6 flex gap-3 justify-center items-center px-8 py-4 text-lg font-medium bg-gradient-to-r rounded-md transition-all duration-300 from-rose-gold to-dusty-rose text-ivory hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    生成风格方案
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 右侧：提示词展示 */}
          <div className="space-y-6">
            <div className="p-8 rounded-xl border shadow-sm backdrop-blur-md bg-ivory/50 border-stone/10">
              <h2 className="mb-4 text-2xl font-medium font-display text-navy">生成的风格方案</h2>
              <p className="mb-6 text-sm text-stone">
                选择一个风格方案，在新窗口中生成婚纱照
              </p>

              {prompts.length === 0 && !isGenerating && (
                <div className="py-12 text-center text-stone">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-stone/30" />
                  <p>上传图片后点击"生成风格方案"</p>
                </div>
              )}

              {isGenerating && (
                <div className="py-12 text-center">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-rose-gold" />
                  <p className="text-stone">AI 正在分析图片并生成风格方案...</p>
                </div>
              )}

              {prompts.length > 0 && (
                <div className="space-y-4">
                  {prompts.map((prompt) => (
                    <div
                      key={prompt.index}
                      className="p-4 rounded-lg border border-stone/20 bg-ivory hover:border-rose-gold/30 transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-gold/20 text-dusty-rose text-sm font-medium">
                              {prompt.index}
                            </span>
                            <h3 className="font-medium text-navy">中文</h3>
                          </div>
                          <p className="text-sm text-stone pl-8">{prompt.chinese}</p>
                          
                          <div className="flex items-center gap-2 pt-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-gold/20 text-dusty-rose text-sm font-medium">
                              EN
                            </span>
                            <h3 className="font-medium text-navy">English</h3>
                          </div>
                          <p className="text-sm text-stone pl-8">{prompt.english}</p>
                        </div>
                        
                        <button
                          onClick={() => handleUsePrompt(prompt.english)}
                          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-navy text-ivory rounded-md hover:bg-navy/90 transition-colors text-sm"
                        >
                          使用
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="flex gap-3 items-start p-4 mt-6 bg-red-50 rounded-lg border border-red-200 max-w-4xl mx-auto">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 成功提示 */}
        {success && (
          <div className="flex gap-3 items-start p-4 mt-6 bg-green-50 rounded-lg border border-green-200 max-w-4xl mx-auto">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-700">{success}</p>
          </div>
        )}
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

