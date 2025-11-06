import { useState, useEffect } from 'react';
import type { SystemAnnouncement } from '@/types/database';

const STORAGE_KEY = 'announcement_dismissed';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24小时

/**
 * 系统公告 Hook
 * 负责获取当前激活的公告，并管理用户的关闭状态
 */
export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/announcements');
      
      if (!response.ok) {
        throw new Error('获取公告失败');
      }

      const data = await response.json();
      const fetchedAnnouncement = data.announcement as SystemAnnouncement | null;

      if (fetchedAnnouncement) {
        setAnnouncement(fetchedAnnouncement);
        
        // 检查用户是否已关闭此公告
        const dismissed = checkIfDismissed(fetchedAnnouncement.id);
        setIsVisible(!dismissed);
      } else {
        setAnnouncement(null);
        setIsVisible(false);
      }
    } catch (error) {
      console.error('获取公告失败:', error);
      setAnnouncement(null);
      setIsVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfDismissed = (announcementId: string): boolean => {
    if (typeof window === 'undefined') return false;

    try {
      const dismissedData = localStorage.getItem(STORAGE_KEY);
      if (!dismissedData) return false;

      const { id, timestamp } = JSON.parse(dismissedData);
      
      // 检查是否是同一条公告且未超过24小时
      if (id === announcementId && Date.now() - timestamp < DISMISS_DURATION) {
        return true;
      }

      // 如果是不同的公告或已超过24小时，清除旧记录
      localStorage.removeItem(STORAGE_KEY);
      return false;
    } catch (error) {
      console.error('检查公告关闭状态失败:', error);
      return false;
    }
  };

  const dismissAnnouncement = () => {
    if (!announcement) return;

    try {
      // 保存关闭状态到 localStorage
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          id: announcement.id,
          timestamp: Date.now(),
        })
      );

      setIsVisible(false);
    } catch (error) {
      console.error('保存公告关闭状态失败:', error);
    }
  };

  return {
    announcement,
    isVisible,
    isLoading,
    dismissAnnouncement,
  };
}





