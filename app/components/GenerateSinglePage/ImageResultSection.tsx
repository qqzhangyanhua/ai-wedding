import Image from 'next/image';
import { Sparkles, Loader2, Download, Copy, Info, Maximize2 } from 'lucide-react';

interface ImageResultSectionProps {
  isGenerating: boolean;
  generatedImage: string | null;
  streamingContent: string;
  onDownload: () => void;
  onCopyBase64: () => void;
  onViewImage: (imageUrl: string, title: string) => void;
}

export function ImageResultSection({
  isGenerating,
  generatedImage,
  streamingContent,
  onDownload,
  onCopyBase64,
  onViewImage,
}: ImageResultSectionProps) {
  return (
    <div className="p-6 rounded-xl border shadow-sm bg-ivory border-stone/10">
      <h2 className="flex gap-2 items-center mb-4 text-xl font-medium font-display text-navy">
        <Sparkles className="w-5 h-5 text-rose-gold" />
        生成结果
      </h2>

      <div className="border-2 border-dashed border-stone/30 rounded-xl p-8 min-h-[400px] flex items-center justify-center">
        {isGenerating ? (
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto w-12 h-12 animate-spin text-rose-gold" />
            <p className="text-stone">AI正在生成中，请稍候...</p>
            {streamingContent && (
              <p className="text-xs text-stone/70">已接收 {streamingContent.length} 字符</p>
            )}
          </div>
        ) : generatedImage ? (
          <div className="space-y-4 w-full">
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden group">
              <Image
                src={generatedImage}
                alt="生成的图片"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <button
                onClick={() => onViewImage(generatedImage, '生成结果')}
                className="flex absolute inset-0 justify-center items-center opacity-0 transition-opacity duration-300 bg-black/50 group-hover:opacity-100"
              >
                <div className="p-3 rounded-full bg-ivory/90">
                  <Maximize2 className="w-6 h-6 text-navy" />
                </div>
              </button>
            </div>

            <div className="flex gap-2 items-start p-3 bg-amber-50 rounded-md border border-amber-200">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="mb-1 font-medium">重要提示</p>
                <p>图片满意请及时下载保存，本页面不会自动储存您的生成结果。</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onDownload}
                className="flex flex-1 gap-2 justify-center items-center px-4 py-3 font-medium rounded-md transition-colors bg-navy text-ivory hover:bg-navy/90"
              >
                <Download className="w-4 h-4" />
                下载图片
              </button>
              <button
                onClick={onCopyBase64}
                className="flex flex-1 gap-2 justify-center items-center px-4 py-3 font-medium rounded-md transition-colors bg-rose-gold/20 text-navy hover:bg-rose-gold/30"
              >
                <Copy className="w-4 h-4" />
                复制Base64
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-stone">
            <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 rounded-full bg-champagne">
              <Sparkles className="w-8 h-8 text-rose-gold" />
            </div>
            <p>生成的图片将在这里显示</p>
          </div>
        )}
      </div>
    </div>
  );
}
