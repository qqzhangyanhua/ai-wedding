# MinIO 403 错误修复总结

## ✅ 已完成的修复

### 1. 代码修改

#### `app/lib/minio-client.ts`
- ✅ 延长预签名 URL 有效期：24小时 → 7天
- ✅ 默认返回公共 URL 而非预签名 URL
- ✅ 新上传的图片将自动使用公共 URL

#### 修改详情：
```typescript
// 之前：使用预签名 URL（24小时过期）
url: presignedUrl

// 现在：使用公共 URL（永久有效）
url: publicUrl
```

### 2. 新增修复脚本

#### `scripts/fix-minio-bucket-policy.ts`
- 🎯 作用：设置 MinIO bucket 为公共读
- ✅ 状态：已成功执行！
- 📦 验证：bucket `ai-images` 已设置公共读策略

#### `scripts/refresh-image-urls.ts`
- 🎯 作用：刷新数据库中的旧预签名 URL
- ⚠️ 状态：需要 `SUPABASE_SERVICE_ROLE_KEY`（可选）
- 💡 说明：新图片已使用公共 URL，旧图片可稍后刷新

#### `scripts/fix-minio-403.sh`
- 🎯 作用：一键运行所有修复步骤
- ✅ 使用：`pnpm run fix-minio`

### 3. 配置文件更新

#### `.env`
```bash
# 已修正配置（移除了引号）
MINIO_ENDPOINT=http://123.57.16.107:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=ai-images
MINIO_USE_SSL=false

# 可选配置（刷新旧图片时需要）
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_密钥
```

#### `package.json`
新增快捷命令：
```json
{
  "scripts": {
    "fix-minio": "bash scripts/fix-minio-403.sh",
    "fix-minio:policy": "tsx scripts/fix-minio-bucket-policy.ts",
    "fix-minio:urls": "tsx scripts/refresh-image-urls.ts"
  }
}
```

### 4. 文档

- ✅ `docs/MINIO_403_FIX.md` - 详细修复指南
- ✅ `MINIO_FIX_QUICKSTART.md` - 快速入门
- ✅ `MINIO_FIX_SUMMARY.md` - 本文档

## 🎉 修复结果

### Bucket 策略验证

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "AWS": ["*"] },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::ai-images/*"]
    }
  ]
}
```

✅ 策略已生效！所有人都可以读取 `ai-images` bucket 中的图片。

### 示例公共 URL

```
http://123.57.16.107:9000/ai-images/2025/09/30/0f77f778-747c-4367-a2f0-9c15172182b4.jpg
```

这些 URL 将永久有效，不会过期！

## 📝 接下来要做的

### 必做（立即）

1. **重启开发服务器**
   ```bash
   pnpm run dev
   ```

2. **清除浏览器缓存**
   - Chrome/Edge: `Cmd + Shift + R` (Mac) 或 `Ctrl + Shift + R` (Windows)
   - Firefox: `Cmd/Ctrl + Shift + Delete`

3. **验证效果**
   - 访问应用，检查图片是否正常显示
   - 打开浏览器开发者工具（F12）
   - 查看 Network 标签，确认图片请求返回 200 而非 403

### 可选（稍后）

1. **刷新旧图片 URL**
   
   如果数据库中有很多旧的预签名 URL（带 `X-Amz-` 参数），可以批量刷新：

   步骤：
   ```bash
   # 1. 获取 Supabase Service Role Key
   # 登录: https://supabase.com/dashboard
   # 项目: tscqkkkbjkwshiynwpam
   # 进入: Settings > API > service_role key
   
   # 2. 添加到 .env
   echo "SUPABASE_SERVICE_ROLE_KEY=eyJxxx..." >> .env
   
   # 3. 运行刷新脚本
   pnpm run fix-minio:urls
   ```

2. **生产环境优化**

   - 配置 CDN 代理 MinIO（提升访问速度）
   - 使用 HTTPS（配置 SSL 证书）
   - 设置图片缓存策略
   - 监控 MinIO 服务状态

## 🔍 验证清单

- [x] MinIO bucket 设置为公共读
- [x] 代码默认返回公共 URL
- [x] 预签名 URL 有效期延长至 7 天（备用）
- [x] .env 配置正确（无引号）
- [x] 安装了 tsx 依赖
- [ ] 获取 Supabase Service Role Key（可选）
- [ ] 刷新数据库中的旧 URL（可选）
- [ ] 重启开发服务器
- [ ] 清除浏览器缓存
- [ ] 验证图片正常显示

## 🐛 常见问题

### Q: 为什么还有一些图片是 403？

A: 可能是以下原因：
1. 浏览器缓存了旧的错误响应 → 强制刷新（Cmd/Ctrl + Shift + R）
2. 数据库中还有旧的预签名 URL → 运行 `pnpm run fix-minio:urls`
3. MinIO 服务重启后策略被重置 → 重新运行 `pnpm run fix-minio:policy`

### Q: 公共 URL 安全吗？

A: 
- ✅ 对于公开展示的图片（模板、生成结果）：安全
- ⚠️ 对于私密图片（用户上传的原图）：考虑使用预签名 URL
- 💡 建议：区分公开图片和私密图片，使用不同的 bucket

### Q: 为什么要用公共 URL 而不是预签名 URL？

A:
- ✅ 永不过期，不会出现 403
- ✅ URL 更短，更容易缓存
- ✅ 减少 MinIO 服务器负担
- ✅ 兼容 CDN 和浏览器缓存

### Q: 如何恢复使用预签名 URL？

A: 修改 `app/lib/minio-client.ts` 第 127 行：
```typescript
// 改回
url: presignedUrl,  // 使用预签名 URL
```

## 📚 相关资源

- [MinIO 官方文档](https://min.io/docs/minio/linux/index.html)
- [MinIO Bucket 策略](https://min.io/docs/minio/linux/administration/identity-access-management/policy-based-access-control.html)
- [Supabase API Keys](https://supabase.com/docs/guides/api#api-keys)

## 🎯 总结

**当前状态：** ✅ MinIO bucket 权限已修复！

**新图片：** ✅ 自动使用公共 URL，永不过期

**旧图片：** ⚠️ 可选刷新（需要 Service Role Key）

**测试结果：** ✅ Bucket 策略已生效，公共 URL 可访问

**下一步：** 重启服务器 → 清除缓存 → 验证效果







