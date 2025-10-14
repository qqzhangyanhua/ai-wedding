import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import NextImage from 'next/image';

interface ImagePreviewModalProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (url: string, index: number) => void;
  projectName?: string;
}

export function ImagePreviewModal({
  images,
  initialIndex,
  isOpen,
  onClose,
  onDownload,
  projectName = '婚纱照'
}: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setZoom(1);
      }
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setZoom(1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      const imageUrl = images[currentIndex];
      
      if (onDownload) {
        // 如果提供了自定义下载处理
        await onDownload(imageUrl, currentIndex);
      } else {
        // 默认下载逻辑
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${projectName}_${currentIndex + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const imageUrl = images[currentIndex];
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: projectName,
          text: `查看我的AI婚纱照 - ${projectName}`,
          url: imageUrl,
        });
      } catch (error) {
        console.log('分享取消或失败:', error);
      }
    } else {
      // 复制链接到剪贴板
      try {
        await navigator.clipboard.writeText(imageUrl);
        alert('图片链接已复制到剪贴板');
      } catch (error) {
        console.error('复制失败:', error);
      }
    }
  };

  return (
    <div className="overflow-hidden fixed inset-0 z-50 flex justify-center items-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex gap-2 items-center text-white">
          <span className="text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </span>
        </div>

        <div className="flex gap-2 items-center">
          {/* 缩放控制 */}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="p-2 rounded-lg transition-all backdrop-blur-sm bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="缩小"
          >
            <ZoomOut className="w-5 h-5 text-white" />
          </button>
          <span className="px-3 py-1 text-sm text-white rounded-lg backdrop-blur-sm bg-white/10">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="p-2 rounded-lg transition-all backdrop-blur-sm bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="放大"
          >
            <ZoomIn className="w-5 h-5 text-white" />
          </button>

          {/* 分隔线 */}
          <div className="w-px h-6 bg-white/20" />

          {/* 分享按钮 */}
          <button
            onClick={handleShare}
            className="p-2 rounded-lg transition-all backdrop-blur-sm bg-white/10 hover:bg-white/20"
            aria-label="分享"
          >
            <Share2 className="w-5 h-5 text-white" />
          </button>

          {/* 下载按钮 */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex gap-2 items-center px-4 py-2 font-medium text-white rounded-lg transition-all backdrop-blur-sm bg-gradient-to-r from-rose-gold to-dusty-rose hover:shadow-glow disabled:opacity-50"
            aria-label="下载图片"
          >
            <Download className="w-5 h-5" />
            {isDownloading ? '下载中...' : '下载'}
          </button>

          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all backdrop-blur-sm bg-white/10 hover:bg-white/20"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* 图片容器 */}
      <div className="flex overflow-hidden relative justify-center items-center w-full h-full">
        {/* 左箭头 */}
        {images.length > 1 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 z-10 p-3 rounded-full transition-all backdrop-blur-sm bg-white/10 hover:bg-white/20"
            aria-label="上一张"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        {/* 图片 */}
        <div
          className="relative max-w-[90vw] max-h-[90vh] transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          <NextImage
            src={images[currentIndex]}
            alt={`${projectName} ${currentIndex + 1}`}
            width={1200}
            height={1600}
            className="object-contain max-w-full max-h-[90vh]"
            priority
          />
        </div>

        {/* 右箭头 */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 z-10 p-3 rounded-full transition-all backdrop-blur-sm bg-white/10 hover:bg-white/20"
            aria-label="下一张"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* 底部缩略图 */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex gap-2 justify-center overflow-x-auto max-w-full">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setZoom(1);
                }}
                className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-rose-gold scale-110'
                    : 'border-white/20 hover:border-white/50'
                }`}
              >
                <NextImage
                  src={img}
                  alt={`缩略图 ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 键盘提示 */}
      <div className="absolute bottom-4 left-4 px-3 py-2 text-xs text-white rounded-lg backdrop-blur-sm bg-white/10">
        ESC 关闭 • ← → 切换
      </div>
    </div>
  );
}




