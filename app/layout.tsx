import type { Metadata } from 'next';
import { Cormorant, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import HeaderBridge from './shared/HeaderBridge';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { ProgressBar } from '@/components/ui/progress-bar';
import { GITHUB_REPO_URL } from '@/lib/constants';

const cormorant = Cormorant({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI婚纱照',
  description: '用AI驱动的照片生成将您的婚纱梦想变为现实',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${cormorant.variable} ${inter.variable} font-body`}>
        <Providers>
          <ProgressBar />
          <div className="min-h-screen bg-white">
            <HeaderBridge />
            <AnnouncementBanner />
            {children}
            <footer className="bg-navy text-ivory py-12 mt-20 border-t border-stone/10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-xl font-display font-medium mb-4">AI婚纱照</h3>
                    <p className="text-stone mb-4 leading-relaxed">
                      用AI驱动的照片生成将您的婚纱梦想变为现实。创造精彩回忆，无需传统成本。
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">产品</h4>
                    <ul className="space-y-2 text-stone">
                      <li><a href="/templates" className="hover:text-dusty-rose transition-colors">模板</a></li>
                      <li><a href="/pricing" className="hover:text-dusty-rose transition-colors">价格</a></li>
                      <li><a href="/dashboard" className="hover:text-dusty-rose transition-colors">仪表盘</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">公司</h4>
                    <ul className="space-y-2 text-stone">
                      <li><a href="#" className="hover:text-dusty-rose transition-colors">关于</a></li>
                      <li><a href="#" className="hover:text-dusty-rose transition-colors">博客</a></li>
                      <li><a href="#" className="hover:text-dusty-rose transition-colors">联系</a></li>
                      <li><a href="#" className="hover:text-dusty-rose transition-colors">隐私</a></li>
                      <li>
                        <a
                          href={GITHUB_REPO_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-dusty-rose transition-colors inline-flex items-center gap-1"
                        >
                          GitHub
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="border-t border-stone/20 mt-8 pt-8 text-center text-stone">
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
