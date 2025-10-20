# MinIO 403 错误快速修复

## 前置准备

1. **确保 .env 文件配置正确**：
   ```bash
   # 必需配置
   MINIO_ENDPOINT=http://123.57.16.107:9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_BUCKET_NAME=ai-images
   MINIO_USE_SSL=false
   
   # 可选（刷新旧图片 URL 时需要）
   SUPABASE_SERVICE_ROLE_KEY=你的_service_role_密钥
   ```

2. **确保 MinIO 服务运行中**：
   ```bash
   curl http://123.57.16.107:9000/minio/health/live
   ```

## 一键修复（推荐）

```bash
# 方法 1: 使用 npm 脚本（推荐）
pnpm run fix-minio

# 方法 2: 直接运行脚本
bash scripts/fix-minio-403.sh
```

这个命令会自动完成：
1. ✅ 设置 MinIO bucket 为公共读
2. ✅ 刷新数据库中所有旧的预签名 URL（如果配置了 Service Role Key）
3. ✅ 新上传的图片将自动使用公共 URL

## 分步执行

如果需要分步执行，可以使用：

```bash
# 步骤 1: 修复 bucket 权限
pnpm run fix-minio:policy

# 步骤 2: 刷新图片 URL
pnpm run fix-minio:urls
```

## 修复完成后

1. 重启开发服务器：
   ```bash
   pnpm run dev
   ```

2. 清除浏览器缓存：
   - Chrome/Edge: `Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac)
   - Firefox: `Ctrl + Shift + Delete`

3. 刷新页面查看效果

## 验证修复

打开浏览器控制台（F12），检查：
- ✅ 图片能正常加载
- ✅ 没有 403 错误
- ✅ 图片 URL 格式为：`http://123.57.16.107:9000/ai-images/...`

## 如果仍有问题

查看详细文档：
```bash
cat docs/MINIO_403_FIX.md
```

或者手动检查：

1. **检查 MinIO 服务**
   ```bash
   curl http://123.57.16.107:9000/minio/health/live
   ```

2. **检查环境变量**
   ```bash
   cat .env.local | grep MINIO
   ```

3. **检查 bucket 策略**
   - 访问 MinIO 控制台：http://123.57.16.107:9000
   - 登录后查看 `ai-images` bucket 的 Access Policy

## 需要帮助？

查看完整文档：`docs/MINIO_403_FIX.md`

