/**
 * 生成分享卡片
 */

export interface ShareCardOptions {
  projectName: string;
  imageUrl: string;
  templateName: string;
  imageCount: number;
}

/**
 * 生成分享文案
 */
export function generateShareText(options: ShareCardOptions): string {
  const { projectName, templateName, imageCount } = options;
  
  return `✨ 我用AI婚纱照生成了${imageCount}张${templateName}风格的婚纱照！

📸 项目：${projectName}
🎨 风格：${templateName}
💝 效果超赞，快来试试吧！

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
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName}-分享卡片.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('下载失败:', error);
    throw error;
  }
}

