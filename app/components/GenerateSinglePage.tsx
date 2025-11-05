"use client";

import { useState } from 'react';
import { Wand2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useTemplateSelection } from '@/hooks/useTemplateSelection';
import { useStreamImageGeneration } from '@/hooks/useStreamImageGeneration';
import { useAvailableSources } from '@/hooks/useAvailableSources';
import { ImageUploadSection } from './GenerateSinglePage/ImageUploadSection';
import { ImageResultSection } from './GenerateSinglePage/ImageResultSection';
import { TemplateSelector } from './GenerateSinglePage/TemplateSelector';
import { GenerationSettings } from './GenerateSinglePage/GenerationSettings';
import { ImagePreviewModal } from './GenerateSinglePage/ImagePreviewModal';
import { ImageGenerationSettings, PreviewState } from './GenerateSinglePage/types';
import type { ModelConfigSource } from '@/types/model-config';

export function GenerateSinglePage() {
  const { user, profile } = useAuth();
  const { templates, loading: templatesLoading } = useTemplates();
  const { sources, loading: sourcesLoading } = useAvailableSources();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<PreviewState>({
    previewImage: null,
    previewTitle: '',
  });
  const [settings, setSettings] = useState<ImageGenerationSettings>({
    facePreservation: 'high',
    creativityLevel: 'conservative'
  });

  const { uploadState, fileInputRef, handleFileSelect, handleDragOver, handleDragLeave, handleDrop } = useImageUpload({
    user,
    onError: setError,
    onSuccess: setSuccess,
  });

  const {
    selectedTemplate,
    selectedPromptIndex,
    customPrompt,
    handleTemplateSelect,
    setSelectedPromptIndex,
    handleCustomPromptChange,
    getCurrentPrompt,
  } = useTemplateSelection();

  const { generationState, generateImage, downloadImage, copyBase64 } = useStreamImageGeneration({
    onError: setError,
    onSuccess: setSuccess,
  });

  const handleGenerate = async (source?: ModelConfigSource): Promise<void> => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const currentPrompt = getCurrentPrompt();
    if (!uploadState.originalImage || !currentPrompt) {
      setError('请上传图片并选择模板/提示词或输入自定义提示词！');
      return;
    }

    await generateImage(uploadState.originalImage, currentPrompt, settings, source);
  };

  const viewImage = (imageUrl: string, title: string): void => {
    setPreviewState({
      previewImage: imageUrl,
      previewTitle: title,
    });
  };

  const closePreview = (): void => {
    setPreviewState({
      previewImage: null,
      previewTitle: '',
    });
  };

  return (
    <div className="py-12 min-h-screen bg-gradient-to-b from-champagne via-ivory to-blush">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
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

          {/* 积分余额显示 */}
          {user && profile && (
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-champagne border border-rose-gold/20 rounded-full shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-gold animate-pulse"></div>
                <span className="text-sm font-medium text-navy">
                  当前积分: <span className={`text-lg font-semibold ${profile.credits >= 15 ? 'text-dusty-rose' : 'text-red-600'}`}>{profile.credits}</span>
                </span>
              </div>
              <div className="w-px h-4 bg-stone/20"></div>
              <span className="text-xs text-stone">
                每次生成消耗 <span className="font-medium text-navy">15</span> 积分
              </span>
            </div>
          )}

          {/* 积分不足警告 */}
          {user && profile && profile.credits < 15 && (
            <div className="flex gap-3 items-start p-4 mt-4 bg-red-50 rounded-lg border border-red-200 max-w-2xl mx-auto">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 mb-1">积分不足</p>
                <p className="text-sm text-red-700">
                  您当前有 <span className="font-bold">{profile.credits}</span> 积分，还需要{' '}
                  <span className="font-bold">{15 - profile.credits}</span> 积分才能生成。
                  <a href="/pricing" className="ml-2 underline hover:text-red-900">
                    前往购买积分
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 mb-8 lg:grid-cols-2">
          <ImageUploadSection
            originalImage={uploadState.originalImage}
            originalImageFile={uploadState.originalImageFile}
            isDragging={uploadState.isDragging}
            isValidatingImage={uploadState.isValidatingImage}
            user={user}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onViewImage={viewImage}
          />

          <ImageResultSection
            isGenerating={generationState.isGenerating}
            generatedImage={generationState.generatedImage}
            streamingContent={generationState.streamingContent}
            onDownload={downloadImage}
            onCopyBase64={copyBase64}
            onViewImage={viewImage}
          />
        </div>

        <TemplateSelector
          templates={templates}
          templatesLoading={templatesLoading}
          selectedTemplate={selectedTemplate}
          selectedPromptIndex={selectedPromptIndex}
          onTemplateSelect={handleTemplateSelect}
          onPromptIndexChange={setSelectedPromptIndex}
        />

        <GenerationSettings
          customPrompt={customPrompt}
          selectedTemplate={selectedTemplate}
          selectedPromptIndex={selectedPromptIndex}
          settings={settings}
          onCustomPromptChange={handleCustomPromptChange}
          onSettingsChange={setSettings}
        />

        <div className="text-center">
          <div className="flex gap-4 justify-center items-center flex-wrap">
            {sources.includes('openAi') && (
              <button
                onClick={() => handleGenerate('openAi')}
                disabled={!uploadState.originalImage || !getCurrentPrompt() || generationState.isGenerating || (profile ? profile.credits < 15 : false)}
                className="flex gap-3 items-center px-12 py-4 text-lg font-medium bg-gradient-to-r rounded-md transition-all duration-300 from-blue-500 to-blue-600 text-white hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generationState.isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    OpenAI 生成
                  </>
                )}
              </button>
            )}

            {sources.includes('openRouter') && (
              <button
                onClick={() => handleGenerate('openRouter')}
                disabled={!uploadState.originalImage || !getCurrentPrompt() || generationState.isGenerating || (profile ? profile.credits < 15 : false)}
                className="flex gap-3 items-center px-12 py-4 text-lg font-medium bg-gradient-to-r rounded-md transition-all duration-300 from-purple-500 to-purple-600 text-white hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generationState.isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    OpenRouter 生成
                  </>
                )}
              </button>
            )}

            {sources.includes('302') && (
              <button
                onClick={() => handleGenerate('302')}
                disabled={!uploadState.originalImage || !getCurrentPrompt() || generationState.isGenerating || (profile ? profile.credits < 15 : false)}
                className="flex gap-3 items-center px-12 py-4 text-lg font-medium bg-gradient-to-r rounded-md transition-all duration-300 from-green-500 to-green-600 text-white hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generationState.isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    302 生成
                  </>
                )}
              </button>
            )}
          </div>
          {sourcesLoading && (
            <p className="mt-3 text-sm text-stone">
              正在加载可用的模型来源...
            </p>
          )}
          {!sourcesLoading && sources.length === 0 && (
            <p className="mt-3 text-sm text-red-600">
              暂无可用的模型配置，请联系管理员
            </p>
          )}
          {!getCurrentPrompt() && uploadState.originalImage && (
            <p className="mt-3 text-sm text-stone">
              请选择模板风格或输入自定义提示词
            </p>
          )}
          {profile && profile.credits < 15 && uploadState.originalImage && getCurrentPrompt() && (
            <p className="mt-3 text-sm text-red-600 font-medium">
              积分不足，需要 15 积分才能生成
            </p>
          )}
        </div>

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

      <ImagePreviewModal
        previewImage={previewState.previewImage}
        previewTitle={previewState.previewTitle}
        onClose={closePreview}
        onCopyBase64={copyBase64}
      />

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
