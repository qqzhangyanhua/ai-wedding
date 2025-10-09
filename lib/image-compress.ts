/**
 * 浏览器端 dataURL 压缩工具（基于 Canvas）。
 * 适用于 JPEG/PNG 等照片类图片的降采样与质量压缩。
 */
export type CompressOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0~1，仅对 JPEG/WebP 生效
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
};

export async function compressDataUrl(dataUrl: string, opts: CompressOptions = {}): Promise<string> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.8, mimeType = 'image/jpeg' } = opts;

  const img = await loadImage(dataUrl);
  const { width, height } = getContainSize(img.width, img.height, maxWidth, maxHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);

  try {
    const out = canvas.toDataURL(mimeType, quality);
    return out || dataUrl;
  } catch {
    return dataUrl;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

function getContainSize(srcW: number, srcH: number, maxW: number, maxH: number) {
  const ratio = Math.min(maxW / srcW, maxH / srcH, 1);
  return { width: Math.round(srcW * ratio), height: Math.round(srcH * ratio) };
}

