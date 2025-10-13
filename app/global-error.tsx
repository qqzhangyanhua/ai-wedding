'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录严重错误
    console.error('全局严重错误:', error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
              系统错误
            </h1>
            <p className="text-gray-600 text-center mb-6">
              应用程序遇到了严重错误，请刷新页面重试。
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                <p className="text-xs font-mono text-gray-800 break-all">
                  {error.message}
                </p>
              </div>
            )}
            <button
              onClick={reset}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              刷新页面
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

