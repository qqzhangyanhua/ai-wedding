"use client";

import { useState } from 'react';
import { Wand2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useTemplateSelection } from '@/hooks/useTemplateSelection';
import { useStreamImageGeneration } from '@/hooks/useStreamImageGeneration';
import { ImageUploadSection } from './GenerateSinglePage/ImageUploadSection';
import { ImageResultSection } from './GenerateSinglePage/ImageResultSection';
import { TemplateSelector } from './GenerateSinglePage/TemplateSelector';
import { GenerationSettings } from './GenerateSinglePage/GenerationSettings';
import { ImagePreviewModal } from './GenerateSinglePage/ImagePreviewModal';
import { ImageGenerationSettings, PreviewState } from './GenerateSinglePage/types';

export function GenerateSinglePage() {
  const { user } = useAuth();
  const { templates, loading: templatesLoading } = useTemplates();
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

  const handleGenerate = async (): Promise<void> => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const currentPrompt = getCurrentPrompt();
    if (!uploadState.originalImage || !currentPrompt) {
      setError('请上传图片并选择模板/提示词或输入自定义提示词！');
      return;
    }

    await generateImage(uploadState.originalImage, currentPrompt, settings);
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
          <button
            onClick={handleGenerate}
            disabled={!uploadState.originalImage || !getCurrentPrompt() || generationState.isGenerating}
            className="flex gap-3 items-center px-12 py-4 mx-auto text-lg font-medium bg-gradient-to-r rounded-md transition-all duration-300 from-rose-gold to-dusty-rose text-ivory hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generationState.isGenerating ? (
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
          {!getCurrentPrompt() && uploadState.originalImage && (
            <p className="mt-3 text-sm text-stone">
              请选择模板风格或输入自定义提示词
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
