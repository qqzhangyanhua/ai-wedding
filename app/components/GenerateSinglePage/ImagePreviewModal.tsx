import Image from 'next/image';
import { X, Download, Copy } from 'lucide-react';

interface ImagePreviewModalProps {
  previewImage: string | null;
  previewTitle: string;
  onClose: () => void;
  onCopyBase64: () => void;
}

export function ImagePreviewModal({
  previewImage,
  previewTitle,
  onClose,
  onCopyBase64,
}: ImagePreviewModalProps) {
  if (!previewImage) return null;

  return (
    <div
      className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/90"
      onClick={onClose}
    >
      <div className="flex relative flex-col w-full max-w-7xl h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium font-display text-ivory">{previewTitle}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors bg-ivory/10 hover:bg-ivory/20"
          >
            <X className="w-6 h-6 text-ivory" />
          </button>
        </div>

        <div
          className="overflow-hidden relative flex-1 rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={previewImage}
            alt={previewTitle}
            fill
            sizes="100vw"
            className="object-contain"
            quality={100}
          />
        </div>

        <div className="flex gap-3 justify-center mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const link = document.createElement('a');
              link.href = previewImage;
              link.download = `${previewTitle}-${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex gap-2 items-center px-6 py-3 font-medium rounded-md transition-colors bg-ivory text-navy hover:bg-ivory/90"
          >
            <Download className="w-4 h-4" />
            下载图片
          </button>
          {previewTitle === '生成结果' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopyBase64();
              }}
              className="flex gap-2 items-center px-6 py-3 font-medium rounded-md transition-colors bg-ivory/20 text-ivory hover:bg-ivory/30"
            >
              <Copy className="w-4 h-4" />
              复制Base64
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
