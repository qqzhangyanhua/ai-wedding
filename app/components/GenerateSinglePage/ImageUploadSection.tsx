import Image from 'next/image';
import { Upload, Loader2, ImageIcon, Maximize2, CheckCircle } from 'lucide-react';

interface ImageUploadSectionProps {
  originalImage: string | null;
  originalImageFile: File | null;
  isDragging: boolean;
  isValidatingImage: boolean;
  user: { id: string } | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onViewImage: (imageUrl: string, title: string) => void;
}

export function ImageUploadSection({
  originalImage,
  originalImageFile,
  isDragging,
  isValidatingImage,
  user,
  fileInputRef,
  onFileSelect,
  onDragOver,
  onDragLeave,
  onDrop,
  onViewImage,
}: ImageUploadSectionProps) {
  return (
    <div className="p-6 rounded-xl border shadow-sm bg-ivory border-stone/10">
      <h2 className="flex gap-2 items-center mb-4 text-xl font-medium font-display text-navy">
        <Upload className="w-5 h-5 text-rose-gold" />
        上传原图
      </h2>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-rose-gold bg-rose-gold/5'
            : 'border-stone/30 hover:border-rose-gold/50 hover:bg-champagne/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
        />
        {originalImage ? (
          <div className="space-y-4">
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden group">
              <Image
                src={originalImage}
                alt="原图预览"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <button
                onClick={() => onViewImage(originalImage, '原图')}
                className="flex absolute inset-0 justify-center items-center opacity-0 transition-opacity duration-300 bg-black/50 group-hover:opacity-100"
              >
                <div className="p-3 rounded-full bg-ivory/90">
                  <Maximize2 className="w-6 h-6 text-navy" />
                </div>
              </button>
            </div>
            {originalImageFile && (
              <div className="space-y-1 text-sm text-stone">
                <p><span className="font-medium">文件名:</span> {originalImageFile.name}</p>
                <p><span className="font-medium">大小:</span> {(originalImageFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>
        ) : isValidatingImage ? (
          <div className="space-y-4">
            <Loader2 className="mx-auto w-12 h-12 animate-spin text-rose-gold" />
            <div>
              <p className="mb-2 text-lg font-medium text-navy">正在验证图片...</p>
              <p className="text-sm text-stone">检测图片是否包含人物</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center items-center mx-auto w-16 h-16 rounded-full bg-champagne">
              <ImageIcon className="w-8 h-8 text-rose-gold" />
            </div>
            <div>
              <p className="mb-2 text-lg font-medium text-navy">点击或拖拽上传图片</p>
              <p className="text-sm text-stone">支持 JPG, PNG, WebP 格式，最大 10MB</p>
              {user && (
                <p className="mt-2 text-xs text-stone/70">上传后将自动验证图片是否包含人物</p>
              )}
            </div>
          </div>
        )}
      </div>

      {user && originalImage && !isValidatingImage && (
        <div className="flex gap-2 items-start p-3 mt-4 bg-green-50 rounded-md border border-green-200">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-800">
            <p className="font-medium">图片验证通过</p>
            <p>已检测到人物，可以继续生成</p>
          </div>
        </div>
      )}
    </div>
  );
}
