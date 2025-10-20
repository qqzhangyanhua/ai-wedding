#!/bin/bash

# AI Wedding 项目部署脚本
# 用于在服务器上构建和启动项目

set -e  # 遇到错误立即退出

echo "================================================"
echo "开始部署 AI Wedding 项目"
echo "================================================"

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
  echo "错误：未找到 package.json，请在项目根目录执行此脚本"
  exit 1
fi

# 1. 安装依赖（如果需要）
echo ""
echo "步骤 1: 检查并安装依赖..."
if [ ! -d "node_modules" ]; then
  echo "安装依赖中..."
  pnpm install --production=false
else
  echo "依赖已存在，跳过安装"
fi

# 2. 构建项目
echo ""
echo "步骤 2: 构建 Next.js 项目..."
echo "清理旧的构建..."
rm -rf .next

echo "开始构建..."
pnpm run build

# 检查构建是否成功
if [ ! -f ".next/prerender-manifest.json" ]; then
  echo "错误：构建失败，未找到 .next/prerender-manifest.json"
  exit 1
fi

echo "✓ 构建成功！"

# 3. 创建日志目录
echo ""
echo "步骤 3: 创建日志目录..."
mkdir -p logs
echo "✓ 日志目录已创建"

# 4. 停止旧的 PM2 进程
echo ""
echo "步骤 4: 停止旧的 PM2 进程..."
pm2 stop ai-wedding 2>/dev/null || echo "没有运行中的进程"
pm2 delete ai-wedding 2>/dev/null || echo "没有需要删除的进程"

# 5. 启动新的 PM2 进程
echo ""
echo "步骤 5: 启动 PM2 进程..."
pm2 start ecosystem.config.js

# 6. 保存 PM2 配置
echo ""
echo "步骤 6: 保存 PM2 配置..."
pm2 save

echo ""
echo "================================================"
echo "✓ 部署完成！"
echo "================================================"
echo ""
echo "查看日志："
echo "  pm2 logs ai-wedding"
echo ""
echo "查看状态："
echo "  pm2 status"
echo ""
echo "重启应用："
echo "  pm2 restart ai-wedding"
echo ""
echo "停止应用："
echo "  pm2 stop ai-wedding"
echo ""



