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
      <div className="min-h-screen bg-gradient-to-b from-champagne to-ivory flex items-center justify-center">
        <div className="flex items-center gap-3 text-stone">
          <Loader2 className="w-8 h-8 animate-spin text-dusty-rose" />
          <span className="text-lg">正在加载画廊...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-champagne to-ivory py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <FadeIn delay={0.1}>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-medium text-navy mb-4">
              AI婚纱照画廊
            </h1>
            <p className="text-stone text-lg max-w-2xl mx-auto">
              欣赏由AI生成的精美婚纱照作品，发现无限创意灵感
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-stone">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-dusty-rose" />
                <span>共 {items.reduce((acc, item) => acc + item.preview_images.length, 0)} 张作品</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-dusty-rose" />
                <span>{new Set(items.map(item => item.user_name)).size} 位创作者</span>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* 画廊内容 */}
        {items.length === 0 ? (
          <FadeIn delay={0.2}>
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-champagne rounded-full flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="w-10 h-10 text-stone" />
              </div>
              <h3 className="text-xl font-display font-medium text-navy mb-2">
                画廊暂时为空
              </h3>
              <p className="text-stone mb-6">
                还没有用户分享作品到画廊，成为第一个分享者吧！
              </p>
              <a
                href="/templates"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-gold to-dusty-rose text-ivory rounded-md hover:shadow-glow transition-all duration-300 font-medium shadow-md"
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
              className="flex w-auto -ml-4"
              columnClassName="pl-4 bg-clip-padding"
            >
              {items.map((item) =>
                item.preview_images.map((imageSrc, imageIndex) => (
                  <div
                    key={`${item.id}-${imageIndex}`}
                    className="mb-4 group cursor-pointer"
                    onClick={() => handleImageClick(imageSrc, item, imageIndex)}
                  >
                    <GlassCard className="overflow-hidden hover:shadow-xl transition-all duration-500">
                      <div className="relative">
                        <Image
                          src={imageSrc}
                          alt={`${item.project_name} - 图片 ${imageIndex + 1}`}
                          width={400}
                          height={600}
                          className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 500px) 100vw, (max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw"
                        />
                        
                        {/* 悬停遮罩 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* 悬停操作按钮 */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // 这里可以添加点赞功能
                              }}
                              className="w-8 h-8 bg-ivory/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-ivory transition-colors shadow-sm"
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
                              className="w-8 h-8 bg-ivory/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-ivory transition-colors shadow-sm"
                              title="下载"
                            >
                              <Download className="w-4 h-4 text-navy" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* 图片信息 */}
                      <div className="p-4">
                        <h3 className="font-display font-medium text-navy mb-1 line-clamp-1">
                          {item.project_name}
                        </h3>
                        <p className="text-sm text-stone mb-2 line-clamp-1">
                          模板：{item.template_name}
                        </p>
                        <div className="flex items-center justify-between text-xs text-stone/70">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{item.user_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
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
              <div className="text-center mt-12">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-champagne text-navy rounded-md hover:bg-ivory transition-all duration-300 font-medium border border-stone/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
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
