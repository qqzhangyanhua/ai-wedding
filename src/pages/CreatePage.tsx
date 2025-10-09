import { useState, useRef } from 'react';
import { Upload, X, Check, Loader2, ArrowLeft, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Template } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Toast } from '../components/Toast';

interface CreatePageProps {
  onNavigate: (page: string) => void;
  selectedTemplate?: Template;
}

export function CreatePage({ onNavigate, selectedTemplate }: CreatePageProps) {
  const { profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setUploadedPhotos(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (uploadedPhotos.length < 5 || !profile || !selectedTemplate) return;

    setIsGenerating(true);
    setUploadProgress(0);

    try {
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: profile.id,
          name: projectName,
          status: 'draft',
          uploaded_photos: uploadedPhotos
        })
        .select()
        .single();

      if (projectError) throw projectError;

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

      const { error: creditError } = await supabase
        .from('profiles')
        .update({ credits: profile.credits - selectedTemplate.price_credits })
        .eq('id', profile.id);

      if (creditError) throw creditError;

      await refreshProfile();

      clearInterval(interval);
      setUploadProgress(100);

      setToast({ message: '项目创建成功！正在准备生成...', type: 'success' });

      setTimeout(() => {
        onNavigate('dashboard');
      }, 1000);
    } catch (error) {
      console.error('生成失败:', error);
      setToast({ message: '生成失败，请重试', type: 'error' });
      setIsGenerating(false);
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
              <img
                src={selectedTemplate.preview_image_url}
                alt={selectedTemplate.name}
                className="w-32 h-40 object-cover rounded-xl shadow-md"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              上传照片 ({uploadedPhotos.length}/10)
            </label>
            <p className="text-sm text-gray-500 mb-4">
              上传5-10张高质量照片，从不同角度清晰展现您的面部
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
              {uploadedPhotos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={photo} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 right-2 p-1.5 bg-green-500 text-white rounded-full">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              ))}

              {uploadedPhotos.length < 10 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-sm text-gray-500 group-hover:text-blue-500 font-medium">添加照片</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploadedPhotos.length < 5 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">请上传至少5张照片才能继续</p>
                  <p>More photos lead to better results. Make sure photos are clear, well-lit, and show your face from different angles.</p>
                </div>
              </div>
            )}
          </div>

          {profile && profile.credits < (selectedTemplate?.price_credits || 10) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800">
                积分不足。您需要 {selectedTemplate?.price_credits} 积分，但只有 {profile.credits}。
                <button onClick={() => onNavigate('pricing')} className="ml-2 font-medium underline">
                  Buy more credits
                </button>
              </p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-xl hover:from-blue-700 hover:to-pink-700 transition-all font-medium text-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Magic...
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                生成婚纱照
              </>
            )}
          </button>

          {isGenerating && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">正在处理您的照片...</span>
                <span className="text-sm font-medium text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-pink-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
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
    </div>
  );
}
