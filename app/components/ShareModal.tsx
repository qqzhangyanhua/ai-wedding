import { X, Copy, Download, Share2, Check, Gift } from 'lucide-react';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { generateShareText, copyShareLink, shareToSocial, downloadShareCard, generateShareCardImage } from '@/lib/share-card';
import { useAuth } from '@/contexts/AuthContext';

interface ShareModalProps {
  projectName: string;
  templateName: string;
  imageUrl: string;
  imageCount: number;
  shareUrl: string;
  onClose: () => void;
}

export function ShareModal({
  projectName,
  templateName,
  imageUrl,
  imageCount,
  shareUrl,
  onClose,
}: ShareModalProps) {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const inviteCode = profile?.invite_code;

  const finalShareUrl = useMemo(() => {
    if (!shareUrl) return shareUrl;
    if (!inviteCode) return shareUrl;
    return shareUrl.includes('?') ? `${shareUrl}&inv=${inviteCode}` : `${shareUrl}?inv=${inviteCode}`;
  }, [shareUrl, inviteCode]);

  const shareText = generateShareText({
    projectName,
    templateName,
    imageUrl,
    imageCount,
    inviteCode,
    siteUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
  });

  const handleCopyLink = async () => {
    const success = await copyShareLink(finalShareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyText = async () => {
    const success = await copyShareLink(shareText);
    if (success) {
      alert('分享文案已复制！');
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadShareCard(imageUrl, projectName);
    } catch {
      alert('下载失败，请重试');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-ivory rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-stone/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-gold to-dusty-rose rounded-lg flex items-center justify-center">
              <Share2 className="w-5 h-5 text-ivory" />
            </div>
            <div>
              <h2 className="text-xl font-display font-medium text-navy">分享作品</h2>
              <p className="text-sm text-stone">分享您的精美婚纱照</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-champagne transition-colors flex items-center justify-center"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-stone" />
          </button>
        </div>

        {/* 预览卡片 */}
        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-champagne to-blush rounded-xl p-6 border border-rose-gold/20">
            <div className="aspect-video relative rounded-lg overflow-hidden mb-4 border-2 border-ivory">
              <Image
                src={imageUrl}
                alt={projectName}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
              {/* 水印 */}
              <div className="absolute bottom-4 right-4 bg-ivory/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md">
                <p className="text-sm font-medium text-navy">AI婚纱照</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-display font-medium text-navy">{projectName}</h3>
              <p className="text-sm text-stone">
                {templateName} 风格 • {imageCount} 张照片
              </p>
              {inviteCode && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-ivory border border-stone/10 rounded-full">
                  <Gift className="w-4 h-4 text-rose-gold" />
                  <span className="text-xs text-navy">我的邀请码：{inviteCode}</span>
                </div>
              )}
            </div>
          </div>

          {/* 分享文案 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-navy">分享文案</label>
              <button
                onClick={handleCopyText}
                className="text-sm text-dusty-rose hover:text-dusty-rose/80 font-medium"
              >
                复制文案
              </button>
            </div>
            <div className="bg-champagne rounded-lg p-4 border border-stone/10">
              <p className="text-sm text-navy whitespace-pre-wrap">{shareText}</p>
            </div>
          </div>

          {/* 分享链接 */}
          <div>
            <label className="text-sm font-medium text-navy mb-2 block">分享链接</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={finalShareUrl}
                readOnly
                className="flex-1 px-4 py-3 bg-champagne border border-stone/10 rounded-lg text-sm text-navy"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-rose-gold to-dusty-rose text-ivory hover:shadow-glow'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    复制
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 社交平台分享 */}
          <div>
            <label className="text-sm font-medium text-navy mb-3 block">分享到社交平台</label>
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => shareToSocial('weibo', {
                  url: finalShareUrl,
                  title: shareText,
                  image: imageUrl,
                })}
                className="flex flex-col items-center gap-2 p-4 bg-champagne hover:bg-champagne/80 rounded-lg transition-colors border border-stone/10"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                  微
                </div>
                <span className="text-xs text-navy font-medium">微博</span>
              </button>
              <button
                onClick={() => shareToSocial('wechat', {
                  url: finalShareUrl,
                  title: shareText,
                })}
                className="flex flex-col items-center gap-2 p-4 bg-champagne hover:bg-champagne/80 rounded-lg transition-colors border border-stone/10"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">
                  微
                </div>
                <span className="text-xs text-navy font-medium">微信</span>
              </button>
              <button
                onClick={() => shareToSocial('qq', {
                  url: finalShareUrl,
                  title: shareText,
                  description: `${templateName} 风格婚纱照`,
                  image: imageUrl,
                })}
                className="flex flex-col items-center gap-2 p-4 bg-champagne hover:bg-champagne/80 rounded-lg transition-colors border border-stone/10"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
                  Q
                </div>
                <span className="text-xs text-navy font-medium">QQ</span>
              </button>
              <button
                onClick={() => shareToSocial('twitter', {
                  url: finalShareUrl,
                  title: shareText,
                })}
                className="flex flex-col items-center gap-2 p-4 bg-champagne hover:bg-champagne/80 rounded-lg transition-colors border border-stone/10"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  𝕏
                </div>
                <span className="text-xs text-navy font-medium">Twitter</span>
              </button>
            </div>
          </div>

          {/* 下载按钮：生成带邀请码的精美分享图 */}
          <button
            onClick={async () => {
              try {
                setDownloading(true);
                const card = await generateShareCardImage({
                  projectName,
                  templateName,
                  imageUrl,
                  imageCount,
                  inviteCode: inviteCode,
                  siteUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
                });
                await downloadShareCard(card, projectName);
              } catch {
                alert('生成/下载分享图失败，请重试');
              } finally {
                setDownloading(false);
              }
            }}
            disabled={downloading}
            className="w-full px-6 py-3 bg-ivory border-2 border-stone/20 text-navy rounded-lg hover:bg-champagne transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {downloading ? '生成中...' : '生成并下载分享图（含邀请码）'}
          </button>
        </div>
      </div>
    </div>
  );
}
