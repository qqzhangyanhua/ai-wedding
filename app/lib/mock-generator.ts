/**
 * 本地试用模式的“伪生成”工具：
 * - 基于上传的第一张图片 dataURL
 * - 使用 Canvas 叠加渐变、柔光与水印，快速生成 3-4 张预览图
 * - 仅用于“未登录免费试用”体验
 */
import type { MockGenerateOptions } from '@/types/image';

export async function mockGenerateImages(options: MockGenerateOptions): Promise<string[]> {
  const { input, variants = 3, watermark = 'AI婚纱照·试用' } = options;
  const img = await loadImage(input);
  const results: string[] = [];

  for (let i = 0; i < variants; i++) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    const W = 768; // 目标大小，便于展示
    const H = Math.round((img.height / img.width) * W) || 1024;
    canvas.width = W;
    canvas.height = H;

    // 绘制原图
    ctx.drawImage(img, 0, 0, W, H);

    // 叠加配色变化（基于 hue/overlay 简单模拟风格差异）
    ctx.globalCompositeOperation = 'overlay';
    const hue = (i * 35) % 360;
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.25)`);
    grad.addColorStop(1, `hsla(${(hue + 140) % 360}, 70%, 40%, 0.25)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 柔光加一层微粒噪点
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = `hsla(${(hue + 60) % 360}, 30%, 50%, 0.15)`;
    ctx.fillRect(0, 0, W, H);

    // 顶部标题条（轻微渐变）
    ctx.globalCompositeOperation = 'source-over';
    const banner = ctx.createLinearGradient(0, 0, 0, 120);
    banner.addColorStop(0, 'rgba(0,0,0,0.45)');
    banner.addColorStop(1, 'rgba(0,0,0,0.0)');
    ctx.fillStyle = banner;
    ctx.fillRect(0, 0, W, 120);

    // 底部信息条
    const foot = ctx.createLinearGradient(0, H - 140, 0, H);
    foot.addColorStop(0, 'rgba(0,0,0,0.0)');
    foot.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = foot;
    ctx.fillRect(0, H - 160, W, 160);

    // 左上水印
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '700 28px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText(watermark, 20, 44);

    // 右下角小徽标
    const badgeW = 160, badgeH = 40, radius = 12;
    roundRect(ctx, W - badgeW - 20, H - badgeH - 20, badgeW, badgeH, radius);
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.fill();
    ctx.fillStyle = '#0b1220';
    ctx.font = '600 16px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillText('AI婚纱照 预览', W - badgeW - 20 + 16, H - 20 - 12);

    results.push(canvas.toDataURL('image/jpeg', 0.92));
  }

  return results;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
