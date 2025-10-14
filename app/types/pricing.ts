// 套餐/计费相关类型

export interface PricingPackage {
  id: string;
  name: string;
  price: number;
  imageCount: number; // 0 表示全部
  features: string[];
  savings?: number;
  recommended?: boolean;
}

