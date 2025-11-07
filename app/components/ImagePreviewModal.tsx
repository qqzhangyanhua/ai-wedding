import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImagePreviewModalProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (url: string, index: number) => Promise<void>;
  projectName: string;
}

export function ImagePreviewModal({
  images,
  initialIndex,
  isOpen,
  onClose,
  onDownload,
  projectName,
}: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [downloading, setDownloading] = useState(false);

  // 当 initialIndex 变化时更新当前索引
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // ESC 键关闭和键盘导航
  useEffect(() => {
    if (!isOpen) return;

    const handlePrevious = () => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const handleNext = () => {
      setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // 防止背景滚动
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, images.length, onClose]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload(images[currentIndex], currentIndex);
    } catch (err) {
      console.error('下载失败:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-5xl max-h-[90vh] w-full animate-in zoom-in-95 duration-200">
        {/* 顶部操作栏 */}
        <div
          className="absolute -top-14 left-0 right-0 flex items-center justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80">
              {projectName} - {currentIndex + 1} / {images.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* 下载按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 text-white transition-all rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              title="下载图片"
            >
              <Download className="w-5 h-5" />
              <span className="text-sm">{downloading ? '下载中...' : '下载'}</span>
            </button>
            {/* 关闭按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 text-white transition-all rounded-lg hover:bg-white/10"
              title="关闭 (ESC)"
            >
              <X className="w-5 h-5" />
              <span className="text-sm">关闭</span>
            </button>
          </div>
        </div>

        {/* 图片容器 */}
        <div
          className="relative w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 上一张按钮 */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 rounded-full bg-black/50 text-white transition-all hover:bg-black/70 backdrop-blur-sm z-10"
              aria-label="上一张"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* 下一张按钮 */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 rounded-full bg-black/50 text-white transition-all hover:bg-black/70 backdrop-blur-sm z-10"
              aria-label="下一张"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div className="relative w-full h-[80vh]">
            <Image
              src={currentImage}
              alt={`${projectName} - ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>
        </div>

        {/* 底部提示 */}
        <div
          className="absolute -bottom-10 left-0 right-0 text-center"
          onClick={onClose}
        >
          <p className="text-sm text-white/60">
            点击空白区域或按 ESC 键关闭
            {images.length > 1 && ' | 使用左右箭头键切换图片'}
          </p>
        </div>
      </div>
    </div>
  );
}
