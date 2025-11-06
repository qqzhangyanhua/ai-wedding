"use client";

import { X, Megaphone } from 'lucide-react';
import { useAnnouncement } from '@/hooks/useAnnouncement';

/**
 * 系统公告横幅组件
 * 固定在页面顶部显示系统公告
 * 支持用户关闭，关闭后24小时内不再显示
 */
export function AnnouncementBanner() {
  const { announcement, isVisible, isLoading, dismissAnnouncement } = useAnnouncement();

  // 加载中或无公告时不显示
  if (isLoading || !announcement || !isVisible) {
    return null;
  }

  // 格式化发布日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="relative bg-gradient-to-r from-navy via-forest to-navy text-ivory border-b border-rose-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* 左侧图标 */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 bg-rose-gold/20 rounded-full">
              <Megaphone className="w-4 h-4 text-rose-gold" />
            </div>
          </div>

          {/* 中间内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <p className="text-sm sm:text-base text-ivory leading-relaxed">
                {announcement.content}
              </p>
              <span className="text-xs text-stone/80 flex-shrink-0">
                {formatDate(announcement.published_at)}
              </span>
            </div>
          </div>

          {/* 右侧关闭按钮 */}
          <button
            onClick={dismissAnnouncement}
            className="flex-shrink-0 p-1 rounded-full hover:bg-ivory/10 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-gold focus:ring-offset-2 focus:ring-offset-navy"
            aria-label="关闭公告"
          >
            <X className="w-5 h-5 text-ivory/80 hover:text-ivory" />
          </button>
        </div>
      </div>

      {/* 底部装饰线 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-gold/30 to-transparent" />
    </div>
  );
}





