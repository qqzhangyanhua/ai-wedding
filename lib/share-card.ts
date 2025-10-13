/**
 * 生成分享卡片
 */

export interface ShareCardOptions {
  projectName: string;
  imageUrl: string;
  templateName: string;
  imageCount: number;
  inviteCode?: string;
  siteUrl?: string;
}

/**
 * 生成分享文案
 */
export function generateShareText(options: ShareCardOptions): string {
  const { projectName, templateName, imageCount, inviteCode, siteUrl } = options;
  
  const inviteTail = inviteCode ? `\n🎁 邀请码：${inviteCode}（新用户有礼）` : '';
  const linkTail = siteUrl ? `\n🔗 体验链接：${siteUrl}${inviteCode ? `?inv=${inviteCode}` : ''}` : '';

  return `✨ 我用AI婚纱照生成了${imageCount}张${templateName}风格的婚纱照！

📸 项目：${projectName}
🎨 风格：${templateName}
💝 效果超赞，快来试试吧！
${inviteTail}${linkTail}

#AI婚纱照 #婚纱摄影 #AI生成`;
}

/**
 * 复制分享链接到剪贴板
 */
export async function copyShareLink(url: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
    
    // 降级方案：使用 document.execCommand
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      return true;
    } finally {
      document.body.removeChild(textArea);
    }
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
}

/**
 * 分享到社交平台
 */
export function shareToSocial(platform: 'wechat' | 'weibo' | 'qq' | 'twitter', options: {
  url: string;
  title: string;
  description?: string;
  image?: string;
}): void {
  const { url, title, description, image } = options;
  
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || '');
  const encodedImage = encodeURIComponent(image || '');
  
  let shareUrl = '';
  
  switch (platform) {
    case 'weibo':
      shareUrl = `https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}&pic=${encodedImage}`;
      break;
    case 'qq':
      shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodedUrl}&title=${encodedTitle}&desc=${encodedDesc}&pics=${encodedImage}`;
      break;
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      break;
    case 'wechat':
      // 微信需要扫码分享，显示二维码
      alert('请使用微信扫描二维码分享');
      return;
    default:
      return;
  }
  
  window.open(shareUrl, '_blank', 'width=600,height=400');
}

/**
 * 下载分享卡片图片
 */
export async function downloadShareCard(
  imageUrl: string,
  projectName: string
): Promise<void> {
  try {
    // 支持 dataURL 直接下载
    let url = imageUrl;
    if (!imageUrl.startsWith('data:')) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      url = URL.createObjectURL(blob);
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName}-分享卡片.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (!imageUrl.startsWith('data:')) URL.revokeObjectURL(url);
  } catch (error) {
    console.error('下载失败:', error);
    throw error;
  }
}

/**
 * 生成带邀请码的精美分享图（Canvas）
 */
export async function generateShareCardImage(opts: ShareCardOptions): Promise<string> {
  const { projectName, imageUrl, templateName, imageCount, inviteCode, siteUrl } = opts;
  const base = await loadImage(imageUrl);
  const W = 1200;
  const H = 630;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');
  canvas.width = W;
  canvas.height = H;

  // 背景渐变
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#f7e7da');
  bg.addColorStop(1, '#f2d3d3');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 左侧主图容器
  const PAD = 40;
  const leftW = Math.floor(W * 0.58);
  const leftH = H - PAD * 2;
  const leftX = PAD;
  const leftY = PAD;

  // 圆角裁剪
  roundRect(ctx, leftX, leftY, leftW, leftH, 24);
  ctx.save();
  ctx.clip();
  // 图像等比裁切填充
  const ratio = Math.max(leftW / base.width, leftH / base.height);
  const dw = base.width * ratio;
  const dh = base.height * ratio;
  const dx = leftX + (leftW - dw) / 2;
  const dy = leftY + (leftH - dh) / 2;
  ctx.drawImage(base, dx, dy, dw, dh);
  ctx.restore();

  // 右侧信息卡
  const cardX = leftX + leftW + 24;
  const cardY = PAD;
  const cardW = W - cardX - PAD;
  const cardH = leftH;
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();

  // 标题
  ctx.fillStyle = '#0b1220';
  ctx.font = '700 44px Cormorant, serif';
  ctx.fillText('AI婚纱照', cardX + 32, cardY + 64);

  // 项目名 + 模板
  ctx.font = '600 24px Inter, system-ui, -apple-system, sans-serif';
  wrapText(ctx, `项目：${projectName}`, cardX + 32, cardY + 110, cardW - 64, 30);
  ctx.font = '500 20px Inter, system-ui, -apple-system, sans-serif';
  wrapText(ctx, `风格：${templateName} • ${imageCount} 张`, cardX + 32, cardY + 150, cardW - 64, 28);

  // 分割线
  ctx.fillStyle = 'rgba(11,18,32,0.08)';
  ctx.fillRect(cardX + 32, cardY + 170, cardW - 64, 2);

  // 邀请码 + 链接
  const link = `${siteUrl || ''}${inviteCode ? (siteUrl?.includes('?') ? `&inv=${inviteCode}` : `?inv=${inviteCode}`) : ''}`;
  const codeBoxY = cardY + 210;
  const codeBoxH = 120;
  roundRect(ctx, cardX + 32, codeBoxY, cardW - 64, codeBoxH, 16);
  ctx.fillStyle = 'rgba(242, 233, 225, 0.9)';
  ctx.fill();
  ctx.fillStyle = '#0b1220';
  ctx.font = '600 18px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText('邀请码', cardX + 48, codeBoxY + 40);
  ctx.font = '800 36px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText(inviteCode || 'XXXXX', cardX + 48, codeBoxY + 86);

  ctx.font = '500 18px Inter, system-ui, -apple-system, sans-serif';
  wrapText(ctx, link || '', cardX + 32, codeBoxY + codeBoxH + 36, cardW - 64, 26);

  // 角标徽章
  const bx = cardX + 32, by = cardY + cardH - 70, bw = 220, bh = 44;
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.fillStyle = '#0b1220';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 18px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillText('立即生成你的婚纱照', bx + 16, by + 28);

  return canvas.toDataURL('image/jpeg', 0.95);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  if (!text) return;
  const words = text.split('');
  let line = '';
  let yy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i];
    const w = ctx.measureText(test).width;
    if (w > maxWidth && i > 0) {
      ctx.fillText(line, x, yy);
      line = words[i];
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
