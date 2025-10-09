import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import HeaderBridge from './shared/HeaderBridge';

export const metadata: Metadata = {
  title: 'AI婚纱照',
  description: '用AI驱动的照片生成将您的婚纱梦想变为现实',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <div className="min-h-screen bg-white">
            <HeaderBridge />
            {children}
            <footer className="bg-gray-900 text-white py-12 mt-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-xl font-bold mb-4">AI婚纱照</h3>
                    <p className="text-gray-400 mb-4">
                      用AI驱动的照片生成将您的婚纱梦想变为现实。创造精彩回忆，无需传统成本。
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-4">产品</h4>
                    <ul className="space-y-2 text-gray-400">
                      <li><a href="/templates" className="hover:text-white transition-colors">模板</a></li>
                      <li><a href="/pricing" className="hover:text-white transition-colors">价格</a></li>
                      <li><a href="/dashboard" className="hover:text-white transition-colors">仪表盘</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold mb-4">公司</h4>
                    <ul className="space-y-2 text-gray-400">
                      <li><a href="#" className="hover:text-white transition-colors">关于</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">博客</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">联系</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">隐私</a></li>
                    </ul>
                  </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                  <p>&copy; 2025 AI婚纱照. 保留所有权利。</p>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
