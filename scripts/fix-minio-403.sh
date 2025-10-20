#!/bin/bash

# MinIO 403 错误一键修复脚本
# 用途：修复 MinIO bucket 权限并刷新数据库中的图片 URL
# 运行：bash scripts/fix-minio-403.sh

echo "🚀 MinIO 403 错误修复工具"
echo "================================"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ 错误: 找不到 .env 文件"
    echo "   请确保在项目根目录运行此脚本"
    exit 1
fi

# 1. 修复 Bucket 权限
echo "📝 步骤 1/2: 修复 MinIO Bucket 权限"
echo "--------------------------------"
npx tsx scripts/fix-minio-bucket-policy.ts
POLICY_STATUS=$?

if [ $POLICY_STATUS -ne 0 ]; then
    echo ""
    echo "❌ Bucket 权限修复失败"
    echo ""
    echo "💡 可能的原因："
    echo "   1. MinIO 服务未运行或无法连接"
    echo "   2. .env 中 MINIO_ENDPOINT 配置不正确"
    echo "   3. 网络问题或防火墙限制"
    echo ""
    echo "🔧 建议检查："
    echo "   - 确认 MinIO 服务运行: curl http://123.57.16.107:9000/minio/health/live"
    echo "   - 检查 .env 配置: cat .env | grep MINIO"
    exit 1
fi
echo ""

# 2. 刷新图片 URL（可选）
echo "📝 步骤 2/2: 刷新数据库中的图片 URL"
echo "--------------------------------"
npx tsx scripts/refresh-image-urls.ts
URL_STATUS=$?

echo ""
if [ $URL_STATUS -ne 0 ]; then
    echo "⚠️  URL 刷新跳过（需要 SUPABASE_SERVICE_ROLE_KEY）"
    echo ""
    echo "✅ Bucket 权限已修复！新上传的图片将使用公共 URL"
    echo ""
    echo "💡 如需刷新旧图片 URL，请："
    echo "   1. 从 Supabase 控制台获取 service_role key"
    echo "   2. 添加到 .env: SUPABASE_SERVICE_ROLE_KEY=你的密钥"
    echo "   3. 重新运行: pnpm run fix-minio:urls"
else
    echo "✅ 所有步骤执行完成！"
fi

echo ""
echo "💡 接下来请："
echo "   1. 重启开发服务器: pnpm run dev"
echo "   2. 清除浏览器缓存（Ctrl/Cmd + Shift + R）"
echo "   3. 刷新页面查看效果"
echo ""
echo "📖 详细文档请查看: docs/MINIO_403_FIX.md"
echo ""

