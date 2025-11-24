"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, Download, User, Calendar, Image as ImageIcon, Loader2 } from 'lucide-react';
import Masonry from 'react-masonry-css';
import type { GalleryItem } from '@/types/database';
import { FadeIn, GlassCard } from '@/components/react-bits';
import { ImagePreviewModal } from '@/components/ImagePreviewModal';

interface GalleryResponse {
  items: GalleryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    alt: string;
    item: GalleryItem;
  } | null>(null);

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  const fetchGalleryItems = async (pageNum: number, append = false) => {
    try {
      const response = await fetch(`/api/gallery?page=${pageNum}&limit=20`);
      if (!response.ok) throw new Error('获取画廊数据失败');
      
      const data: GalleryResponse = await response.json();
      
      if (append) {
        setItems(prev => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('获取画廊数据失败:', error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchGalleryItems(1);
      setLoading(false);
    };
    
    loadInitialData();
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchGalleryItems(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return '刚刚';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}天前`;
    return `${Math.floor(seconds / 604800)}周前`;
  };

  const handleImageClick = (imageSrc: string, item: GalleryItem, imageIndex: number) => {
    setSelectedImage({
      src: imageSrc,
      alt: `${item.project_name} - 图片 ${imageIndex + 1}`,
      item,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-champagne to-ivory">
        <div className="flex gap-3 items-center text-stone">
          <Loader2 className="w-8 h-8 animate-spin text-dusty-rose" />
          <span className="text-lg">正在加载画廊...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 min-h-screen bg-gradient-to-b from-champagne to-ivory">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <FadeIn delay={0.1}>
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-medium font-display text-navy">
              AI婚纱照画廊
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-stone">
              欣赏由AI生成的精美婚纱照作品，发现无限创意灵感
            </p>
            <div className="flex gap-6 justify-center items-center mt-6 text-sm text-stone">
              <div className="flex gap-2 items-center">
                <ImageIcon className="w-4 h-4 text-dusty-rose" />
                <span>共 {items.reduce((acc, item) => acc + item.preview_images.length, 0)} 张作品</span>
              </div>
              <div className="flex gap-2 items-center">
                <User className="w-4 h-4 text-dusty-rose" />
                <span>{new Set(items.map(item => item.user_name)).size} 位创作者</span>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* 画廊内容 */}
        {items.length === 0 ? (
          <FadeIn delay={0.2}>
            <div className="py-20 text-center">
              <div className="flex justify-center items-center mx-auto mb-6 w-20 h-20 rounded-full bg-champagne">
                <ImageIcon className="w-10 h-10 text-stone" />
              </div>
              <h3 className="mb-2 text-xl font-medium font-display text-navy">
                画廊暂时为空
              </h3>
              <p className="mb-6 text-stone">
                还没有用户分享作品到画廊，成为第一个分享者吧！
              </p>
              <a
                href="/templates"
                className="inline-flex gap-2 items-center px-6 py-3 font-medium bg-gradient-to-r rounded-md shadow-md transition-all duration-300 from-rose-gold to-dusty-rose text-ivory hover:shadow-glow"
              >
                <ImageIcon className="w-5 h-5" />
                开始创作
              </a>
            </div>
          </FadeIn>
        ) : (
          <FadeIn delay={0.2}>
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="flex -ml-4 w-auto"
              columnClassName="pl-4 bg-clip-padding"
            >
              {items.map((item) =>
                item.preview_images.map((imageSrc, imageIndex) => (
                  <div
                    key={`${item.id}-${imageIndex}`}
                    className="mb-4 cursor-pointer group"
                    onClick={() => handleImageClick(imageSrc, item, imageIndex)}
                  >
                    <GlassCard className="overflow-hidden transition-all duration-500 hover:shadow-xl">
                      <div className="relative">
                        <Image
                          src={imageSrc}
                          alt={`${item.project_name} - 图片 ${imageIndex + 1}`}
                          width={400}
                          height={600}
                          className="object-cover w-full h-auto transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 500px) 100vw, (max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw"
                        />
                        
                        {/* 悬停遮罩 */}
                        <div className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity duration-300 from-navy/70 group-hover:opacity-100" />
                        
                        {/* 悬停操作按钮 */}
                        <div className="absolute top-3 right-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // 这里可以添加点赞功能
                              }}
                              className="flex justify-center items-center w-8 h-8 rounded-full shadow-sm backdrop-blur-sm transition-colors bg-ivory/90 hover:bg-ivory"
                              title="点赞"
                            >
                              <Heart className="w-4 h-4 text-dusty-rose" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // 下载图片
                                const link = document.createElement('a');
                                link.href = imageSrc;
                                link.download = `${item.project_name}_${imageIndex + 1}.jpg`;
                                link.click();
                              }}
                              className="flex justify-center items-center w-8 h-8 rounded-full shadow-sm backdrop-blur-sm transition-colors bg-ivory/90 hover:bg-ivory"
                              title="下载"
                            >
                              <Download className="w-4 h-4 text-navy" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* 图片信息 */}
                      <div className="p-4">
                        <h3 className="mb-1 font-medium font-display text-navy line-clamp-1">
                          {item.project_name}
                        </h3>
                        <p className="mb-2 text-sm text-stone line-clamp-1">
                          模板：{item.template_name}
                        </p>
                        <div className="flex justify-between items-center text-xs text-stone/70">
                          <div className="flex gap-1 items-center">
                            <User className="w-3 h-3" />
                            <span>{item.user_name}</span>
                          </div>
                          <div className="flex gap-1 items-center">
                            <Calendar className="w-3 h-3" />
                            <span>{getTimeAgo(item.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                ))
              )}
            </Masonry>

            {/* 加载更多按钮 */}
            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex gap-2 items-center px-8 py-3 mx-auto font-medium rounded-md border transition-all duration-300 bg-champagne text-navy hover:bg-ivory border-stone/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      加载中...
                    </>
                  ) : (
                    '加载更多'
                  )}
                </button>
              </div>
            )}
          </FadeIn>
        )}
      </div>

      {/* 图片预览模态框 */}
      {selectedImage && (
        <ImagePreviewModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          images={[selectedImage.src]}
          initialIndex={0}
          projectName={selectedImage.item.project_name}
          onDownload={async (url: string) => {
            try {
              const response = await fetch(url);
              const blob = await response.blob();
              const downloadUrl = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = `${selectedImage.item.project_name}-${Date.now()}.jpg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(downloadUrl);
            } catch (error) {
              console.error('下载失败:', error);
            }
          }}
        />
      )}
    </div>
  );
}
