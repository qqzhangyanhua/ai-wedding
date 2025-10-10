export interface ImageRating {
  score: number; // 0-100
  badges: string[];
  rank: 'top' | 'good' | 'normal';
}

const BADGES = [
  { label: '⭐ 最佳构图', weight: 0.9 },
  { label: '❤️ 最自然', weight: 0.85 },
  { label: '✨ 最佳光线', weight: 0.88 },
  { label: '🎨  艺术感', weight: 0.82 },
  { label: '💫 完美角度', weight: 0.87 },
  { label: '🌟 编辑推荐', weight: 0.95 },
];

/**
 * 为图片生成评分和标签
 * 使用伪随机算法确保同一张图片总是得到相同的评分
 */
export function rateImage(imageUrl: string, index: number, totalCount: number): ImageRating {
  // 使用URL和索引生成伪随机种子
  const seed = hashString(imageUrl + index);
  
  // 基础分数：70-95
  const baseScore = 70 + (seededRandom(seed) * 25);
  
  // 前几张图片倾向于更高分
  const positionBonus = index < 3 ? 5 : 0;
  
  const finalScore = Math.min(95, baseScore + positionBonus);
  
  // 选择标签
  const badges: string[] = [];
  const badgeCount = finalScore >= 90 ? 2 : finalScore >= 80 ? 1 : 0;
  
  if (badgeCount > 0) {
    // 根据分数选择合适的标签
    const availableBadges = BADGES.filter(b => {
      const badgeSeed = hashString(imageUrl + b.label);
      return seededRandom(badgeSeed) > (1 - b.weight);
    });
    
    // 取前N个
    badges.push(...availableBadges.slice(0, badgeCount).map(b => b.label));
  }
  
  // 确定排名
  let rank: 'top' | 'good' | 'normal' = 'normal';
  if (finalScore >= 90) rank = 'top';
  else if (finalScore >= 80) rank = 'good';
  
  return {
    score: Math.round(finalScore),
    badges,
    rank,
  };
}

/**
 * 简单的字符串哈希函数
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 基于种子的伪随机数生成器 (0-1)
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * 批量评分并返回排序后的结果
 */
export function rateImages(imageUrls: string[]): Map<number, ImageRating> {
  const ratings = new Map<number, ImageRating>();
  
  imageUrls.forEach((url, index) => {
    ratings.set(index, rateImage(url, index, imageUrls.length));
  });
  
  return ratings;
}
