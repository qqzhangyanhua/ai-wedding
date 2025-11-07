import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Download } from 'lucide-react';

interface ImagePreviewModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImagePreviewModal({ src, alt, onClose }: ImagePreviewModalProps) {
  const [downloading, setDownloading] = useState(false);

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // 防止背景滚动
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // 使用 fetch 获取图片数据
      const response = await fetch(src);
      const blob = await response.blob();
      
      // 创建临时 URL
      const blobUrl = window.URL.createObjectURL(blob);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${alt}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('下载失败:', err);
      alert('下载失败，请重试');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-w-5xl max-h-[90vh] w-full animate-in zoom-in-95 duration-200">
        {/* 顶部操作栏 - 点击可关闭 */}
        <div 
          className="absolute -top-14 left-0 right-0 flex items-center justify-between"
          onClick={onClose}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80">{alt}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* 下载按钮 - 阻止冒泡 */}
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
            {/* 关闭按钮 - 阻止冒泡 */}
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

        {/* 图片容器 - 阻止点击事件冒泡 */}
        <div 
          className="relative w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full h-[80vh]">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>
        </div>

        {/* 底部提示 - 点击可关闭 */}
        <div 
          className="absolute -bottom-10 left-0 right-0 text-center"
          onClick={onClose}
        >
          <p className="text-sm text-white/60">点击空白区域或按 ESC 键关闭</p>
        </div>
      </div>
    </div>
  );
}
