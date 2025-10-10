import { useState, useEffect } from 'react';
import { Download, Heart, Share2, ArrowLeft, Sparkles, Lock, Check, X, Repeat, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useImageLikes } from '../hooks/useImageLikes';
import { ImageCompareSlider } from '../components/ImageCompareSlider';
import { recommendPackage, getBestValue, calculateSavings } from '@/lib/pricing-recommender';
import { rateImages } from '@/lib/image-rating';

interface ResultsPageProps {
  onNavigate: (page: string) => void;
  generationId?: string;
}

interface Generation {
  id: string;
  status: string;
  preview_images: string[];
  high_res_images: string[];
  completed_at: string;
  project: {
    name: string;
    uploaded_photos: string[];
  };
  template: {
    name: string;
  };
}

const mockResults = [
  'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1603650/pexels-photo-1603650.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2246476/pexels-photo-2246476.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1579708/pexels-photo-1579708.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1616470/pexels-photo-1616470.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2403251/pexels-photo-2403251.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1438072/pexels-photo-1438072.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/161764/santorini-travel-holiday-vacation-161764.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1933239/pexels-photo-1933239.jpeg?auto=compress&cs=tinysrgb&w=800'
];

export function ResultsPage({ onNavigate, generationId }: ResultsPageProps) {
  const { user } = useAuth();
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(!!generationId);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const localLike = useState<Set<number>>(new Set());
  const { liked: likedPreview, toggleLike: toggleLikePreview } = useImageLikes(generationId, 'preview');
  const { liked: likedHigh, toggleLike: toggleLikeHigh } = useImageLikes(generationId, 'high_res');
  const [tab, setTab] = useState<'preview' | 'high_res'>('preview');

  useEffect(() => {
    if (!generationId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from('generations')
          .select(`
            *,
            project:projects(name, uploaded_photos),
            template:templates(name)
          `)
          .eq('id', generationId)
          .maybeSingle();

        if (error) throw error;
        setGeneration(data);
      } catch (err) {
        console.error('获取生成结果失败:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [generationId]);

  const resultsPreview = generation?.preview_images && generation.preview_images.length > 0
    ? generation.preview_images
    : mockResults;
  const resultsHigh = generation?.high_res_images && generation.high_res_images.length > 0
    ? generation.high_res_images
    : [] as string[];
  const currentImages = tab === 'preview' ? resultsPreview : resultsHigh;

  const recommendedPackages = recommendPackage(selectedImages.size, currentImages.length);
  const bestValue = getBestValue(selectedImages.size, currentImages.length);
  const imageRatings = rateImages(currentImages);

  const toggleImageSelection = (index: number) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedImages(newSelection);
  };

  const handlePurchase = () => {
    onNavigate('pricing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回仪表盘
        </button>

        <div className="bg-gradient-to-r from-blue-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">照片已准备好！</h1>
              <p className="text-blue-100">{generation?.project?.name || '您的项目'} - 我们为您生成了 {resultsPreview.length} 张精美婚纱照</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <button className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-medium flex items-center gap-2 shadow-lg">
              <Heart className="w-5 h-5" />
              保存收藏
            </button>
            <button className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all font-medium flex items-center gap-2 border border-white/20">
              <Share2 className="w-5 h-5" />
              分享相册
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">预览画廊</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedImages.size > 0 ? `已选择 ${selectedImages.size} 张图片` : '选择图片购买'}
              </p>
            </div>
            <button
              onClick={handlePurchase}
              disabled={selectedImages.size === 0}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-xl hover:from-blue-700 hover:to-pink-700 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              购买所选 ({selectedImages.size})
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">预览模式</p>
              <p>这些是带水印的预览图。购买后可下载无水印的高清版本。</p>
            </div>
          </div>

          {/* 预览/高清切换 */}
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => setTab('preview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'preview' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              预览
            </button>
            <button
              onClick={() => setTab('high_res')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'high_res' ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
              disabled={resultsHigh.length === 0}
            >
              高清{resultsHigh.length === 0 ? '（未解锁）' : ''}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentImages.map((url, index) => {
              const rating = imageRatings.get(index);
              
              return (
              <div
                key={index}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden group cursor-pointer"
                onClick={() => setLightboxIndex(index)}
              >
                <Image
                  src={url}
                  alt={`Result ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                (tab === 'preview' ? toggleLikePreview : toggleLikeHigh)(index);
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                (tab === 'preview' ? likedPreview : likedHigh).has(index)
                  ? 'bg-red-600 text-white'
                  : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white'
              }`}
              aria-label={(tab === 'preview' ? likedPreview : likedHigh).has(index) ? '取消收藏' : '收藏'}
            >
              <Heart className={`w-5 h-5 ${(tab === 'preview' ? likedPreview : likedHigh).has(index) ? 'fill-white' : ''}`} />
            </button>
            {tab === 'preview' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleImageSelection(index);
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                selectedImages.has(index)
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white'
              }`}
              aria-label={selectedImages.has(index) ? '取消选择' : '选择'}
            >
              {selectedImages.has(index) && <Check className="w-5 h-5" />}
            </button>
            )}
          </div>

                {/* AI评分标签 */}
                {rating && rating.badges.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {rating.badges.map((badge, idx) => (
                      <div 
                        key={idx}
                        className="px-2 py-1 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-lg shadow-lg"
                      >
                        {badge}
                      </div>
                    ))}
                  </div>
                )}

                {/* 增强水印显示 */}
                {tab === 'preview' && (
                  <>
                    {/* 对角线水印 */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                      <div 
                        className="text-white text-6xl font-bold opacity-10 whitespace-nowrap"
                        style={{ transform: 'rotate(-45deg) scale(1.5)' }}
                      >
                        PREVIEW • 预览 • PREVIEW
                      </div>
                    </div>
                    {/* 边角标签 */}
                    <div className="absolute top-0 left-0 px-4 py-2 bg-gradient-to-br from-blue-600/80 to-pink-600/80 backdrop-blur-sm text-white text-xs font-bold rounded-br-xl">
                      预览版
                    </div>
                  </>
                )}

                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
                    {tab === 'preview' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleImageSelection(index);
                      }}
                      className="flex-1 px-3 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all font-medium text-sm flex items-center justify-center gap-2"
                    >
                      {selectedImages.has(index) ? (
                        <>
                          <Check className="w-4 h-4" />
                          已选择
                        </>
                      ) : (
                        '选择'
                      )}
                    </button>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">价格选项</h3>
            {selectedImages.size > 0 && bestValue && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                为您推荐：{bestValue.name}
              </div>
            )}
          </div>
          {selectedImages.size > 0 && (
            <p className="text-sm text-gray-600 mb-4">
              已选择 {selectedImages.size} 张图片 • 根据您的选择智能推荐最优惠套餐
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedPackages.slice(0, 3).map((pkg) => {
              const isRecommended = pkg.recommended;
              const savings = selectedImages.size > 0 ? calculateSavings(selectedImages.size, pkg.price) : 0;
              
              return (
                <div
                  key={pkg.id}
                  className={`rounded-xl p-6 border-2 transition-all cursor-pointer ${
                    isRecommended
                      ? 'bg-gradient-to-br from-blue-600 to-pink-600 text-white border-blue-600 shadow-lg'
                      : 'bg-white text-gray-900 border-transparent hover:border-blue-500'
                  }`}
                >
                  {isRecommended && (
                    <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold mb-3">
                      推荐
                    </div>
                  )}
                  <div className="text-3xl font-bold mb-2">${pkg.price}</div>
                  <div className={`mb-4 ${isRecommended ? 'text-blue-100' : 'text-gray-600'}`}>
                    {pkg.name}
                  </div>
                  {savings > 0 && (
                    <div className={`text-sm font-medium mb-3 ${isRecommended ? 'text-green-200' : 'text-green-600'}`}>
                      节省 ${savings}
                    </div>
                  )}
                  <ul className={`space-y-2 text-sm ${isRecommended ? 'text-blue-50' : 'text-gray-600'}`}>
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={currentImages}
          index={lightboxIndex}
          liked={(user && generationId ? (tab === 'preview' ? likedPreview : likedHigh) : localLike[0])}
          onToggleLike={(i) => (user && generationId ? (tab === 'preview' ? toggleLikePreview : toggleLikeHigh)(i) : localLike[1]((prev) => {
            const next = new Set(prev);
            if (next.has(i)) next.delete(i); else next.add(i);
            return next;
          }))}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={(i) => setLightboxIndex(i)}
          generationId={generationId}
          imageType={tab}
          originalPhotos={generation?.project?.uploaded_photos || []}
        />
      )}
    </div>
  );
}

function Lightbox({ images, index, onClose, onIndexChange, liked, onToggleLike, generationId, imageType = 'preview', originalPhotos = [] }: { images: string[]; index: number; onClose: () => void; onIndexChange: (i: number) => void; liked: Set<number>; onToggleLike: (i: number) => void; generationId?: string; imageType?: 'preview' | 'high_res'; originalPhotos?: string[]; }) {
  const [compareMode, setCompareMode] = useState(false);
  
  // 键盘导航：Esc 关闭，←/→ 切换，C切换对比模式
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + images.length) % images.length);
      if (e.key === 'c' || e.key === 'C') {
        if (originalPhotos.length > 0) setCompareMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [images.length, index, onClose, onIndexChange, originalPhotos.length]);

  const current = images[index];
  const originalPhoto = originalPhotos[index] || originalPhotos[0];

  const toPrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onIndexChange((index - 1 + images.length) % images.length);
  };
  const toNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onIndexChange((index + 1) % images.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* 顶部条：索引指示器与关闭 */}
      <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4">
        <div className="text-white/80 text-sm font-medium">
          {index + 1} / {images.length}
        </div>
        <button
          className="p-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="关闭"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <button
        className="absolute left-4 p-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all"
        onClick={toPrev}
        aria-label="上一张"
      >
        ‹
      </button>
      <div className="relative w-full h-full max-w-6xl max-h-[85vh]">
        {compareMode && originalPhoto ? (
          <div onClick={(e) => e.stopPropagation()}>
            <ImageCompareSlider
              beforeImage={originalPhoto}
              afterImage={current}
              beforeLabel="原图"
              afterLabel="AI生成"
            />
          </div>
        ) : (
          <>
            <Image
              src={current}
              alt="预览"
              fill
              className="object-contain"
              sizes="100vw"
              onClick={(e) => e.stopPropagation()}
            />
            {/* 增强水印 - Lightbox版本 */}
            {imageType === 'preview' && (
              <>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <div 
                    className="text-white text-8xl font-bold opacity-10 whitespace-nowrap"
                    style={{ transform: 'rotate(-45deg)' }}
                  >
                    PREVIEW • 预览 • PREVIEW
                  </div>
                </div>
                <div className="absolute top-8 left-8 px-6 py-3 bg-gradient-to-br from-blue-600/80 to-pink-600/80 backdrop-blur-sm text-white text-sm font-bold rounded-xl">
                  预览版 • 购买后无水印
                </div>
              </>
            )}
          </>
        )}
      </div>
      {/* 底部操作条：点赞/下载/分享/对比 */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLike(index); }}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${liked.has(index) ? 'bg-red-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          <Heart className="w-5 h-5" />
          {liked.has(index) ? '已收藏' : '收藏'}
        </button>
        <a
          href={current}
          download
          onClick={(e) => {
            e.stopPropagation();
            // 异步上报下载记录（不阻断浏览器下载）
            void (async () => {
              try {
                const { data: session } = await supabase.auth.getSession();
                const token = session.session?.access_token;
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;
                await fetch('/api/images/track-download', {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({ generation_id: generationId, index, image_type: imageType }),
                });
              } catch (err) { void err; }
            })();
          }}
          className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 bg-white/10 text-white hover:bg-white/20"
        >
          <Download className="w-5 h-5" />
          下载
        </a>
        <button
          className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 bg-white/10 text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(current).catch(() => {}); }}
        >
          <Share2 className="w-5 h-5" />
          复制链接
        </button>
        {originalPhotos.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setCompareMode(prev => !prev); }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${compareMode ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            <Repeat className="w-5 h-5" />
            {compareMode ? '退出对比' : '对比原图'}
          </button>
        )}
      </div>

      {/* 左右切换 */}
      <button
        className="absolute left-4 p-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all"
        onClick={toPrev}
        aria-label="上一张"
      >
        ‹
      </button>
      <button
        className="absolute right-4 p-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all"
        onClick={toNext}
        aria-label="下一张"
      >
        ›
      </button>
    </div>
  );
}
