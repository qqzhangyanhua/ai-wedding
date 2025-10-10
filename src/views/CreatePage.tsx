import { useState } from 'react';
import { Loader2, ArrowLeft, Image as ImageIcon, Check } from 'lucide-react';
import { Template } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Toast } from '../components/Toast';
import { generateImage } from '@/lib/image';
import NextImage from 'next/image';
import { PhotoUploader } from '../components/PhotoUploader';
import { GenerationNotification } from '../components/GenerationNotification';
import { GeneratingTips } from '../components/GeneratingTips';

interface CreatePageProps {
  onNavigate: (page: string) => void;
  selectedTemplate?: Template;
}

export function CreatePage({ onNavigate, selectedTemplate }: CreatePageProps) {
  const { profile, refreshProfile } = useAuth();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<'uploading' | 'analyzing' | 'generating' | 'completed' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [backgroundGenerationId, setBackgroundGenerationId] = useState<string | null>(null);
  const [allowBackground, setAllowBackground] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [savedState, setSavedState] = useState<{ photos: string[]; projectName: string } | null>(null);

  const handleGenerate = async () => {
    if (uploadedPhotos.length < 5 || !profile || !selectedTemplate) return;

    setIsGenerating(true);
    setUploadProgress(0);
    setGenerationStage('uploading');
    setGenerationError(null);
    
    setSavedState({
      photos: uploadedPhotos,
      projectName: projectName,
    });

    let generationId: string | null = null;
    try {
      // 阶段1: 上传照片和创建项目（0-20%）
      setGenerationStage('uploading');
      setUploadProgress(5);

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: profile.id,
          name: projectName,
          status: 'processing',
          uploaded_photos: uploadedPhotos
        })
        .select()
        .single();

      if (projectError) throw projectError;
      setUploadProgress(20);

      // 阶段2: 分析照片（20-40%）
      setGenerationStage('analyzing');
      
      const { data: generation, error: generationError } = await supabase
        .from('generations')
        .insert({
          project_id: project.id,
          user_id: profile.id,
          template_id: selectedTemplate.id,
          status: 'pending',
          credits_used: selectedTemplate.price_credits
        })
        .select()
        .single();

      if (generationError) throw generationError;
      generationId = generation.id;

      const { error: creditError } = await supabase
        .from('profiles')
        .update({ credits: profile.credits - selectedTemplate.price_credits })
        .eq('id', profile.id);

      if (creditError) throw creditError;

      await refreshProfile();
      setUploadProgress(40);

      // 阶段3: AI生成图片（40-90%）
      setGenerationStage('generating');
      setUploadProgress(50);

      const prompt = `${selectedTemplate.name}: ${selectedTemplate.description || ''} wedding portrait, high quality, cinematic lighting`;
      const items = await generateImage(prompt, { n: 4, size: '1024x1024', response_format: 'url' });
      const urls = items.map((i) => i.url).filter(Boolean) as string[];

      setUploadProgress(90);

      // 阶段4: 保存结果（90-100%）
      const now = new Date().toISOString();
      const { error: genUpdateErr } = await supabase
        .from('generations')
        .update({ status: 'completed', preview_images: urls, completed_at: now })
        .eq('id', generation.id);
      if (genUpdateErr) throw genUpdateErr;

      const { error: projUpdateErr } = await supabase
        .from('projects')
        .update({ status: 'completed' })
        .eq('id', project.id);
      if (projUpdateErr) throw projUpdateErr;

      setGenerationStage('completed');
      setUploadProgress(100);

      if (allowBackground) {
        setBackgroundGenerationId(generation.id);
        setToast({ message: '已添加到后台生成队列，可继续浏览其他页面', type: 'success' });
        setIsGenerating(false);
        setGenerationStage(null);
      } else {
        setToast({ message: '生成完成！即将跳转到结果页', type: 'success' });
        setTimeout(() => {
          window.location.href = `/results/${generation.id}`;
        }, 800);
      }
    } catch (error: unknown) {
      console.error('生成失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      try {
        if (generationId) {
          await supabase
            .from('generations')
            .update({ status: 'failed', error_message: errorMessage })
            .eq('id', generationId);
        }
      } catch (persistErr) {
        console.error('生成失败后回写失败:', persistErr);
      }
      
      setGenerationError(errorMessage);
      setToast({ message: '生成失败，请查看详情并重试', type: 'error' });
      setIsGenerating(false);
      setGenerationStage(null);
    }
  };

  const handleRetry = () => {
    if (savedState) {
      setUploadedPhotos(savedState.photos);
      setProjectName(savedState.projectName);
      setGenerationError(null);
      handleGenerate();
    }
  };

  const canGenerate = uploadedPhotos.length >= 5 && projectName.trim() &&
                      profile && profile.credits >= (selectedTemplate?.price_credits || 10);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('templates')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回模板
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-6 mb-8">
            {selectedTemplate && (
              <NextImage
                src={selectedTemplate.preview_image_url}
                alt={selectedTemplate.name}
                width={128}
                height={160}
                className="object-cover rounded-xl shadow-md w-32 h-40"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedTemplate?.name || '创建项目'}
              </h1>
              <p className="text-gray-600 mb-4">{selectedTemplate?.description}</p>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                  {selectedTemplate?.price_credits} 积分
                </div>
                <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">
                  您的余额：{profile?.credits || 0} 积分
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">项目名称</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="例如：我们的梦幻婚纱照"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-8">
            <PhotoUploader
              photos={uploadedPhotos}
              onChange={setUploadedPhotos}
              maxPhotos={10}
              minPhotos={5}
            />
          </div>

          {profile && profile.credits < (selectedTemplate?.price_credits || 10) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800">
                积分不足。您需要 {selectedTemplate?.price_credits} 积分，但只有 {profile.credits}。
                <button onClick={() => onNavigate('pricing')} className="ml-2 font-medium underline">
                  购买更多积分
                </button>
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="allowBackground"
                checked={allowBackground}
                onChange={(e) => setAllowBackground(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="allowBackground" className="text-sm text-gray-700 cursor-pointer flex-1">
                后台生成（可继续浏览其他页面，生成完成后通知您）
              </label>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-xl hover:from-blue-700 hover:to-pink-700 transition-all font-medium text-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在生成魔法...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  生成婚纱照
                </>
              )}
            </button>
          </div>

          {generationError && savedState && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-red-900 mb-1">生成失败</h4>
                  <p className="text-sm text-red-700">{generationError}</p>
                  <p className="text-xs text-red-600 mt-2">已保留您的照片和项目信息，可以直接重试</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium flex items-center justify-center gap-2"
              >
                <Loader2 className="w-5 h-5" />
                重新生成
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {generationStage === 'uploading' && '上传照片中...'}
                    {generationStage === 'analyzing' && '分析面部特征中...'}
                    {generationStage === 'generating' && 'AI生成图片中...'}
                    {generationStage === 'completed' && '生成完成！'}
                  </span>
                </div>
                <span className="text-sm font-medium text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-pink-600 transition-all duration-500"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {generationStage === 'uploading' && '正在上传您的照片到云端...'}
                {generationStage === 'analyzing' && '正在分析您的面部特征，这需要一些时间...'}
                {generationStage === 'generating' && '正在使用AI生成您的婚纱照，通常需要1-2分钟...'}
                {generationStage === 'completed' && '已完成所有处理，即将跳转！'}
              </p>
              <GeneratingTips visible={true} />
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            最佳效果小贴士
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              使用高分辨率照片，光线良好
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              从多个角度清晰地展示你的脸
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              避免太阳镜、帽子或面部遭挡物
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              包含不同表情和姿势的照片
            </li>
          </ul>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {backgroundGenerationId && (
        <GenerationNotification
          generationId={backgroundGenerationId}
          onDismiss={() => setBackgroundGenerationId(null)}
        />
      )}
    </div>
  );
}
