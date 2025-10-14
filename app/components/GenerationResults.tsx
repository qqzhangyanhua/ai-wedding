/**
 * 生成结果展示组件
 * 从原 CreatePage 提取 150+ 行结果展示逻辑
 */

import { useState } from 'react';
import { Sparkles, AlertCircle, Heart, Eye, Download, ArrowLeft } from 'lucide-react';
import NextImage from 'next/image';
import { GlassCard, FadeIn } from '@/components/react-bits';
import { ImagePreviewModal } from './ImagePreviewModal';

interface GenerationResultsProps {
  images: string[];
  generationId: string | null;
  projectName: string;
  onNavigateToDashboard: () => void;
}

export function GenerationResults({
  images,
  generationId,
  projectName,
  onNavigateToDashboard,
}: GenerationResultsProps) {
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const toggleFavorite = (index: number) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(index)) {
        newFavorites.delete(index);
      } else {
        newFavorites.add(index);
      }
      return newFavorites;
    });
  };

  const handleDownloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${projectName || '婚纱照'}_预览_${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setToast({ message: '图片下载成功！', type: 'success' });
    } catch (error) {
      console.error('下载失败:', error);
      setToast({ message: '下载失败，请重试', type: 'error' });
    }
  };

  return (
    <>
      <FadeIn delay={0.4}>
        <GlassCard className="mt-8">
          <div className="p-8">
            <div className="flex gap-3 items-center mb-6">
              <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-br rounded-md shadow-sm from-rose-gold to-dusty-rose">
                <Sparkles className="w-6 h-6 text-ivory" />
              </div>
              <div>
                <h2 className="text-2xl font-medium font-display text-navy">生成完成！</h2>
                <p className="text-stone">为您生成了 {images.length} 张精美婚纱照</p>
              </div>
            </div>

            <div className="p-4 mb-6 bg-gradient-to-r rounded-lg border from-rose-gold/10 to-dusty-rose/10 border-rose-gold/20">
              <div className="flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-rose-gold flex-shrink-0 mt-0.5" />
                <div className="text-sm text-navy">
                  <p className="mb-1 font-medium">预览模式</p>
                  <p className="text-stone">
                    这些是带水印的预览图。如需下载无水印的高清版本，请前往结果页面购买。
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {images.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-[3/4] rounded-md overflow-hidden group border border-stone/10 hover:border-rose-gold/30 transition-all duration-500 hover:shadow-xl"
                >
                  <NextImage
                    src={url}
                    alt={`生成结果 ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />

                  {/* 悬停遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity duration-500 from-navy/60 group-hover:opacity-100" />

                  {/* 顶部按钮组 */}
                  <div className="flex absolute top-3 right-3 gap-2 items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <button
                      onClick={() => toggleFavorite(index)}
                      className={`flex justify-center items-center w-10 h-10 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ${
                        favorites.has(index)
                          ? 'bg-rose-gold text-white'
                          : 'bg-ivory/90 text-stone hover:bg-ivory'
                      } hover:scale-110`}
                      aria-label="收藏"
                    >
                      <Heart className={`w-5 h-5 ${favorites.has(index) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* 底部信息和操作栏 */}
                  <div className="flex absolute right-3 bottom-3 left-3 gap-2 justify-between items-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <span className="px-2 py-1 text-sm font-medium rounded backdrop-blur-sm text-ivory bg-navy/80">
                      #{index + 1}
                    </span>

                    <div className="flex gap-2">
                      {/* 查看大图 */}
                      <button
                        onClick={() => setPreviewImageIndex(index)}
                        className="flex justify-center items-center w-8 h-8 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 bg-ivory/90 hover:bg-ivory hover:scale-110"
                        aria-label="查看大图"
                      >
                        <Eye className="w-4 h-4 text-stone" />
                      </button>

                      {/* 下载 */}
                      <button
                        onClick={() => handleDownloadImage(url, index)}
                        className="flex justify-center items-center w-8 h-8 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 bg-ivory/90 hover:bg-ivory hover:scale-110"
                        aria-label="下载图片"
                      >
                        <Download className="w-4 h-4 text-stone" />
                      </button>
                    </div>
                  </div>

                  {/* 收藏标记（固定显示） */}
                  {favorites.has(index) && (
                    <div className="absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded backdrop-blur-sm bg-rose-gold/90 text-ivory">
                      已收藏
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 收藏统计 */}
            {favorites.size > 0 && (
              <div className="p-4 mb-4 rounded-lg border bg-rose-gold/10 border-rose-gold/20">
                <div className="flex gap-2 items-center text-sm text-navy">
                  <Heart className="w-4 h-4 fill-current text-rose-gold" />
                  <span>
                    您收藏了 <strong className="text-rose-gold">{favorites.size}</strong> 张照片
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 justify-center sm:flex-row">
              <button
                onClick={() =>
                  generationId && (window.location.href = `/results/${generationId}`)
                }
                className="flex gap-2 justify-center items-center px-6 py-3 font-medium bg-gradient-to-r rounded-md shadow-md transition-all duration-300 from-rose-gold to-dusty-rose text-ivory hover:shadow-glow"
              >
                <Sparkles className="w-5 h-5" />
                查看完整结果页面
              </button>
              <button
                onClick={onNavigateToDashboard}
                className="flex gap-2 justify-center items-center px-6 py-3 font-medium rounded-md border transition-all duration-300 bg-champagne text-navy hover:bg-ivory border-stone/20"
              >
                <ArrowLeft className="w-5 h-5" />
                返回仪表盘
              </button>
            </div>
          </div>
        </GlassCard>
      </FadeIn>

      {/* 图片预览模态框 */}
      {previewImageIndex !== null && (
        <ImagePreviewModal
          images={images}
          initialIndex={previewImageIndex}
          isOpen={previewImageIndex !== null}
          onClose={() => setPreviewImageIndex(null)}
          onDownload={handleDownloadImage}
          projectName={projectName || '婚纱照预览'}
        />
      )}

      {/* Toast 通知 */}
      {toast && (
        <div className="flex fixed right-4 bottom-4 gap-2 items-center px-4 py-3 rounded-lg shadow-lg bg-navy text-ivory">
          {toast.message}
        </div>
      )}
    </>
  );
}
