export interface PricingPackage {
  id: string;
  name: string;
  price: number;
  imageCount: number;
  features: string[];
  savings?: number;
  recommended?: boolean;
}

const packages: PricingPackage[] = [
  {
    id: 'basic',
    name: '基础套餐',
    price: 19.99,
    imageCount: 20,
    features: ['20张高清图像', '无水印', '立即下载'],
  },
  {
    id: 'standard',
    name: '标准套餐',
    price: 39.99,
    imageCount: 50,
    features: ['50张高清图像', '所有格式', '优先支持'],
  },
  {
    id: 'complete',
    name: '完整套餐',
    price: 49.99,
    imageCount: 100,
    features: ['100张高清图像', '所有格式', '优先支持', '额外赠送10张'],
  },
  {
    id: 'premium',
    name: '高级套餐',
    price: 99.99,
    imageCount: 0, // 0表示全部
    features: ['全部图像', '包含原始文件', '商业许可', '终身支持'],
  },
];

export function recommendPackage(selectedCount: number, totalImages: number): PricingPackage[] {
  const allPackages = packages.map(pkg => {
    const effectiveCount = pkg.imageCount === 0 ? totalImages : pkg.imageCount;
    const pricePerImage = pkg.price / effectiveCount;
    
    let result = { ...pkg };
    
    // 计算是否适合用户选择数量
    if (selectedCount > 0) {
      if (selectedCount <= effectiveCount) {
        // 适合
        if (selectedCount > effectiveCount * 0.7) {
          // 如果选择数量超过套餐的70%，标记为推荐
          result.recommended = true;
          
          // 计算节省的金额（与按需购买对比）
          const singlePrice = 1.5; // 假设单张价格
          result.savings = Math.round((selectedCount * singlePrice - pkg.price) * 100) / 100;
        }
      }
    } else {
      // 没有选择，推荐中间档
      if (pkg.id === 'standard') {
        result.recommended = true;
      }
    }
    
    return result;
  });

  // 按推荐度和性价比排序
  return allPackages.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    
    // 按价格排序
    return a.price - b.price;
  });
}

export function getBestValue(selectedCount: number, totalImages: number): PricingPackage | null {
  if (selectedCount === 0) return null;
  
  // 找到刚好覆盖选择数量的最便宜套餐
  const suitable = packages
    .filter(pkg => {
      const count = pkg.imageCount === 0 ? totalImages : pkg.imageCount;
      return count >= selectedCount;
    })
    .sort((a, b) => a.price - b.price);
  
  return suitable[0] || null;
}

export function calculateSavings(selectedCount: number, packagePrice: number): number {
  const singlePrice = 1.5; // 单张价格
  const totalSinglePrice = selectedCount * singlePrice;
  return Math.max(0, Math.round((totalSinglePrice - packagePrice) * 100) / 100);
}
