import { useState, useEffect } from 'react';
import { Download, Heart, Share2, ArrowLeft, Sparkles, Lock, Check, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(!!generationId);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    if (generationId) {
      fetchGeneration();
    }
  }, [generationId]);

  const fetchGeneration = async () => {
    if (!generationId) return;

    try {
      const { data, error } = await supabase
        .from('generations')
        .select(`
          *,
          project:projects(name),
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
  };

  const results = generation?.preview_images && generation.preview_images.length > 0
    ? generation.preview_images
    : mockResults;

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
    setShowPurchaseModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
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
              <p className="text-blue-100">{generation?.project?.name || '您的项目'} - 我们为您生成了 {results.length} 张精美婚纱照</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <button className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-medium flex items-center gap-2 shadow-lg">
              <Heart className="w-5 h-5" />
              Save Favorites
            </button>
            <button className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all font-medium flex items-center gap-2 border border-white/20">
              <Share2 className="w-5 h-5" />
              Share Collection
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Preview Gallery</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedImages.size > 0 ? `${selectedImages.size} images selected` : 'Select images to purchase'}
              </p>
            </div>
            <button
              onClick={handlePurchase}
              disabled={selectedImages.size === 0}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-xl hover:from-blue-700 hover:to-pink-700 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Purchase Selected ({selectedImages.size})
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Preview Mode</p>
              <p>These are watermarked previews. Purchase to download high-resolution versions without watermarks.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mockResults.map((url, index) => (
              <div
                key={index}
                className="relative aspect-[3/4] rounded-xl overflow-hidden group cursor-pointer"
                onClick={() => setLightboxImage(url)}
              >
                <img
                  src={url}
                  alt={`Result ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  >
                    {selectedImages.has(index) && <Check className="w-5 h-5" />}
                  </button>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none">
                  <div className="text-white text-4xl font-bold opacity-20">PREVIEW</div>
                </div>

                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
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
                          Selected
                        </>
                      ) : (
                        'Select'
                      )}
                    </button>
                    <button className="px-3 py-2 bg-white/90 backdrop-blur-sm text-gray-900 rounded-lg hover:bg-white transition-all">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">价格选项</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-6 border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer">
              <div className="text-3xl font-bold text-gray-900 mb-2">$19.99</div>
              <div className="text-gray-600 mb-4">基础套餐</div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  20张高清图像
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  无水印
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  立即下载
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-pink-600 text-white rounded-xl p-6 border-2 border-blue-600 shadow-lg">
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold mb-3">
                最受欢迎
              </div>
              <div className="text-3xl font-bold mb-2">$49.99</div>
              <div className="text-blue-100 mb-4">完整套餐</div>
              <ul className="space-y-2 text-sm text-blue-50">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  100张高清图像
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  所有格式
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  优先支持
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer">
              <div className="text-3xl font-bold text-gray-900 mb-2">$99.99</div>
              <div className="text-gray-600 mb-4">高级套餐</div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  全部 {mockResults.length} 张图像
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  包含原始文件
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  商业许可
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none">
            <div className="text-white text-6xl font-bold opacity-20">PREVIEW</div>
          </div>
        </div>
      )}
    </div>
  );
}
