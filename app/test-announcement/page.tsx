"use client";

import { useEffect, useState } from 'react';
import type { SystemAnnouncement } from '@/types/database';

/**
 * 系统公告测试页面
 * 访问 /test-announcement 来诊断公告功能
 */
export default function TestAnnouncementPage() {
  const [publicData, setPublicData] = useState<{
    announcement: SystemAnnouncement | null;
    error?: string;
    timestamp?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const testPublicAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/announcements', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      const data = await response.json();
      setPublicData({
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      setPublicData({
        announcement: null,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testPublicAPI();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-champagne via-ivory to-blush p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-navy mb-4">
            🔧 系统公告测试页面
          </h1>
          <p className="text-stone">
            此页面用于诊断系统公告功能是否正常工作
          </p>
        </div>

        {/* 测试按钮 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={testPublicAPI}
            disabled={loading}
            className="w-full px-6 py-3 bg-navy text-white rounded-lg hover:bg-navy/90 disabled:opacity-50 font-medium"
          >
            {loading ? '测试中...' : '🔄 重新测试 /api/announcements'}
          </button>
        </div>

        {/* 公共 API 测试结果 */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-navy">
              📡 公共 API 测试结果
            </h2>
            <span className="text-sm text-gray-500">
              {publicData?.timestamp && new Date(publicData.timestamp).toLocaleString('zh-CN')}
            </span>
          </div>

          {publicData?.error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold mb-2">❌ 请求失败</p>
              <p className="text-red-600 text-sm">{publicData.error}</p>
            </div>
          ) : publicData?.announcement ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold mb-2">✅ 成功获取公告</p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b bg-gray-50">
                      <td className="px-4 py-2 font-semibold w-32">ID</td>
                      <td className="px-4 py-2 font-mono text-xs">{publicData.announcement.id}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-semibold">内容</td>
                      <td className="px-4 py-2">{publicData.announcement.content}</td>
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="px-4 py-2 font-semibold">状态</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          publicData.announcement.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {publicData.announcement.is_active ? '✓ 激活' : '未激活'}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-semibold">发布日期</td>
                      <td className="px-4 py-2">
                        {new Date(publicData.announcement.published_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 font-semibold">创建时间</td>
                      <td className="px-4 py-2">
                        {new Date(publicData.announcement.created_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : publicData ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-semibold mb-2">⚠️ 没有激活的公告</p>
              <p className="text-yellow-700 text-sm mb-4">
                API 返回 null，说明数据库中没有 is_active = true 的公告
              </p>
              <div className="bg-white p-4 rounded border">
                <p className="font-semibold mb-2">解决方案：</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>访问管理后台：<code className="bg-gray-100 px-2 py-1 rounded">/admin/announcements</code></li>
                  <li>创建一条新公告</li>
                  <li>勾选"立即显示公告"</li>
                  <li>点击"创建公告"或"更新公告"</li>
                  <li>回到此页面刷新测试</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <p className="text-gray-600">点击上方按钮开始测试</p>
            </div>
          )}
        </div>

        {/* 原始响应数据 */}
        {publicData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-navy mb-4">
              📋 原始响应数据
            </h3>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(publicData, null, 2)}
            </pre>
          </div>
        )}

        {/* 诊断建议 */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-navy mb-4">
            🔍 诊断步骤
          </h3>
          
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="font-semibold text-sm">步骤 1: 检查数据库</p>
              <p className="text-sm text-gray-600 mt-1">
                在 Supabase SQL Editor 执行：
              </p>
              <pre className="bg-gray-50 p-2 rounded text-xs mt-2 overflow-x-auto">
                SELECT * FROM system_announcements WHERE is_active = true;
              </pre>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <p className="font-semibold text-sm">步骤 2: 检查 RLS 策略</p>
              <p className="text-sm text-gray-600 mt-1">
                确保有 "Public can view active announcements" 策略，并且 roles 包含 {'{anon,authenticated}'}
              </p>
              <pre className="bg-gray-50 p-2 rounded text-xs mt-2 overflow-x-auto">
{`SELECT policyname, roles::text 
FROM pg_policies 
WHERE tablename = 'system_announcements';`}
              </pre>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <p className="font-semibold text-sm">步骤 3: 执行修复脚本</p>
              <p className="text-sm text-gray-600 mt-1">
                在 Supabase SQL Editor 执行：
              </p>
              <code className="text-xs bg-gray-50 px-2 py-1 rounded">
                database-migrations/fix-and-test-announcements.sql
              </code>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <p className="font-semibold text-sm">步骤 4: 创建测试公告</p>
              <p className="text-sm text-gray-600 mt-1">
                访问 <a href="/admin/announcements" className="text-blue-600 hover:underline">/admin/announcements</a> 创建并激活一条公告
              </p>
            </div>
          </div>
        </div>

        {/* 快捷链接 */}
        <div className="flex gap-4 justify-center">
          <a 
            href="/admin/announcements"
            className="px-6 py-3 bg-navy text-white rounded-lg hover:bg-navy/90 font-medium"
          >
            📝 管理后台
          </a>
          <a 
            href="/"
            className="px-6 py-3 bg-white border-2 border-navy text-navy rounded-lg hover:bg-gray-50 font-medium"
          >
            🏠 返回首页
          </a>
        </div>
      </div>
    </div>
  );
}

