import { useState } from 'react';
import { Loader2, ArrowLeft, Image as ImageIcon, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Template } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Toast } from '../components/Toast';
import { generateImage } from '@/lib/image';
import NextImage from 'next/image';
import { PhotoUploader } from '../components/PhotoUploader';
import { GenerationNotification } from '../components/GenerationNotification';
import { GeneratingTips } from '../components/GeneratingTips';
import { FadeIn, GlassCard } from '@/components/react-bits';

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

      setGenerationStage('generating');
      setUploadProgress(50);

      const prompt = `${selectedTemplate.name}: ${selectedTemplate.description || ''} wedding portrait, high quality, cinematic lighting`;
      const items = await generateImage(prompt, { n: 4, size: '1024x1024', response_format: 'url' });
      const urls = items.map((i) => i.url).filter(Boolean) as string[];

      setUploadProgress(90);

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
        setToast({ message: '已添加到后台生成队列,可继续浏览其他页面', type: 'success' });
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
      setToast({ message: '生成失败,请查看详情并重试', type: 'error' });
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
    <div className="min-h-screen bg-gradient-to-b from-champagne to-ivory py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn delay={0.1}>
          <button
            onClick={() => onNavigate('templates')}
            className="flex items-center gap-2 text-stone hover:text-navy mb-8 transition-colors font-medium"
            aria-label="返回模板页面"
          >
            <ArrowLeft className="w-5 h-5" />
            返回模板
          </button>
        </FadeIn>

        <FadeIn delay={0.2}>
          <GlassCard className="mb-8">
            <div className="p-8">
              <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
                {selectedTemplate && (
                  <NextImage
                    src={selectedTemplate.preview_image_url}
                    alt={selectedTemplate.name}
                    width={128}
                    height={160}
                    className="object-cover rounded-lg shadow-md w-32 h-40 border-2 border-ivory"
                  />
                )}
                <div className="flex-1">
                  <h1 className="text-3xl font-display font-medium text-navy mb-2">
                    {selectedTemplate?.name || '创建项目'}
                  </h1>
                  <p className="text-stone mb-4 leading-relaxed">{selectedTemplate?.description}</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="px-4 py-2 bg-champagne border border-rose-gold/20 text-navy rounded-md font-medium flex items-center gap-2">
                      <Check className="w-4 h-4 text-rose-gold" />
                      {selectedTemplate?.price_credits} 积分
                    </div>
                    <div className="px-4 py-2 bg-ivory border border-stone/10 text-stone rounded-md font-medium">
                      您的余额：{profile?.credits || 0} 积分
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-navy mb-2">项目名称</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="例如：我们的梦幻婚纱照"
                  className="w-full px-4 py-3 border border-stone/20 bg-champagne rounded-md focus:ring-2 focus:ring-dusty-rose/30 focus:border-dusty-rose transition-all"
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
                <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-red-900 mb-2">积分不足</h4>
                      <p className="text-red-800 mb-1">
                        您当前有 <span className="font-bold">{profile.credits}</span> 积分，
                        还需要 <span className="font-bold text-red-600">{(selectedTemplate?.price_credits || 10) - profile.credits}</span> 积分才能生成
                      </p>
                      <p className="text-sm text-red-700 mb-4">
                        本模板需要 {selectedTemplate?.price_credits} 积分
                      </p>
                      <button 
                        onClick={() => onNavigate('pricing')}
                        className="px-6 py-3 bg-gradient-to-r from-rose-gold to-dusty-rose text-white rounded-lg hover:shadow-xl transition-all font-medium flex items-center gap-2"
                        aria-label="前往价格页面购买积分"
                      >
                        <Sparkles className="w-5 h-5" />
                        立即购买积分
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-champagne rounded-md border border-stone/10">
                  <input
                    type="checkbox"
                    id="allowBackground"
                    checked={allowBackground}
                    onChange={(e) => setAllowBackground(e.target.checked)}
                    className="w-4 h-4 text-dusty-rose rounded focus:ring-2 focus:ring-dusty-rose/30"
                  />
                  <label htmlFor="allowBackground" className="text-sm text-navy cursor-pointer flex-1">
                    后台生成（可继续浏览其他页面,生成完成后通知您）
                  </label>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isGenerating}
                  className="w-full py-4 bg-gradient-to-r from-rose-gold to-dusty-rose text-ivory rounded-md hover:shadow-glow transition-all duration-300 font-medium text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-destructive mb-1">生成失败</h4>
                      <p className="text-sm text-destructive/80">{generationError}</p>
                      <p className="text-xs text-stone mt-2">已保留您的照片和项目信息,可以直接重试</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="w-full px-4 py-3 bg-destructive text-ivory rounded-md hover:bg-destructive/90 transition-all font-medium flex items-center justify-center gap-2"
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
                      <Loader2 className="w-4 h-4 animate-spin text-dusty-rose" />
                      <span className="text-sm font-medium text-navy">
                        {generationStage === 'uploading' && '上传照片中...'}
                        {generationStage === 'analyzing' && '分析面部特征中...'}
                        {generationStage === 'generating' && 'AI生成图片中...'}
                        {generationStage === 'completed' && '生成完成！'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-dusty-rose">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-champagne rounded-full overflow-hidden border border-stone/10">
                    <div
                      className="h-full bg-gradient-to-r from-rose-gold to-dusty-rose transition-all duration-500"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone mt-2">
                    {generationStage === 'uploading' && '正在上传您的照片到云端...'}
                    {generationStage === 'analyzing' && '正在分析您的面部特征,这需要一些时间...'}
                    {generationStage === 'generating' && '正在使用AI生成您的婚纱照,通常需要1-2分钟...'}
                    {generationStage === 'completed' && '已完成所有处理,即将跳转！'}
                  </p>
                  <GeneratingTips visible={true} />
                </div>
              )}
            </div>
          </GlassCard>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="bg-champagne border border-rose-gold/20 rounded-lg p-6">
            <h3 className="font-display font-medium text-navy mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-rose-gold" />
              最佳效果小贴士
            </h3>
            <ul className="space-y-2 text-sm text-stone">
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-rose-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-rose-gold" />
                </div>
                使用高分辨率照片,光线良好
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-rose-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-rose-gold" />
                </div>
                从多个角度清晰地展示你的脸
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-rose-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-rose-gold" />
                </div>
                避免太阳镜、帽子或面部遮挡物
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-rose-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-rose-gold" />
                </div>
                包含不同表情和姿势的照片
              </li>
            </ul>
          </div>
        </FadeIn>
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
