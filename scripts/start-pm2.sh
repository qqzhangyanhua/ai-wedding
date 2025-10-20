#!/bin/bash

# AI Wedding 快速启动脚本（假设已构建）

set -e

echo "检查构建文件..."
if [ ! -f ".next/prerender-manifest.json" ]; then
  echo "错误：未找到构建文件，请先运行部署脚本："
  echo "  bash scripts/deploy.sh"
  exit 1
fi

echo "创建日志目录..."
mkdir -p logs

echo "停止旧进程..."
pm2 stop ai-wedding 2>/dev/null || true
pm2 delete ai-wedding 2>/dev/null || true

echo "启动 PM2..."
pm2 start ecosystem.config.js

echo "保存 PM2 配置..."
pm2 save

echo "✓ 启动成功！"
echo ""
echo "查看日志: pm2 logs ai-wedding"
echo "查看状态: pm2 status"

