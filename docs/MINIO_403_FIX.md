# MinIO 图片 403 错误修复指南

## 问题描述

访问 MinIO 存储的图片时出现 403 错误，通常表现为：

```
ImageError: "url" parameter is valid but upstream response is invalid
statusCode: 403
```

## 原因分析

1. **预签名 URL 过期**：预签名 URL 有时效性（默认 24 小时），过期后无法访问
2. **Bucket 权限不足**：Bucket 未设置公共读策略
3. **网络访问限制**：MinIO 服务器防火墙或网络配置问题

## 解决方案

### 方案一：设置 Bucket 为公共读（推荐）

#### 1. 运行修复脚本

```bash
# 设置 bucket 公共读权限
npx tsx scripts/fix-minio-bucket-policy.ts
```

这个脚本会：
- 检查 bucket 是否存在
- 设置公共读策略
- 验证策略是否生效
- 列出部分对象供测试

#### 2. 刷新数据库中的旧 URL

```bash
# 将数据库中的预签名 URL 替换为公共 URL
npx tsx scripts/refresh-image-urls.ts
```

这个脚本会：
- 扫描 `generations` 表中的图片 URL
- 扫描 `templates` 表中的图片 URL
- 将预签名 URL 转换为公共 URL
- 更新数据库记录

#### 3. 验证修复效果

访问任意一个公共 URL，格式如：
```
http://123.57.16.107:9000/ai-images/path/to/image.png
```

如果能正常访问，说明修复成功！

### 方案二：延长预签名 URL 有效期（临时方案）

如果不想使用公共 URL，可以延长预签名 URL 的有效期。

代码已修改为 7 天有效期（在 `app/lib/minio-client.ts`）：

```typescript
// 生成预签名 URL（7天有效期）
const presignedUrl = await client.presignedGetObject(bucketName, objectName, 7 * 24 * 60 * 60);
```

**注意**：这只是临时方案，7 天后仍会过期。

### 方案三：配置 CDN 代理（生产环境推荐）

#### 1. 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name cdn.yourdomain.com;

    location /ai-images/ {
        proxy_pass http://123.57.16.107:9000/ai-images/;
        proxy_set_header Host $host;
        proxy_cache_valid 200 7d;
        proxy_cache_bypass $http_cache_control;
        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

#### 2. 使用云厂商 CDN

- 阿里云 OSS CDN
- 腾讯云 COS CDN
- AWS CloudFront

#### 3. 修改环境变量

```env
# 使用 CDN 域名
MINIO_ENDPOINT=https://cdn.yourdomain.com
MINIO_USE_SSL=true
```

## 配置检查清单

### 1. 环境变量

确保 `.env.local` 包含正确的配置：

```env
MINIO_ENDPOINT=http://123.57.16.107:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=ai-images
MINIO_USE_SSL=false
```

### 2. MinIO 服务器配置

```bash
# 登录 MinIO 服务器
ssh user@123.57.16.107

# 检查 MinIO 服务状态
systemctl status minio

# 检查防火墙
sudo firewall-cmd --list-all
sudo ufw status
```

### 3. Bucket 策略验证

使用 MinIO 客户端检查：

```bash
mc alias set myminio http://123.57.16.107:9000 minioadmin minioadmin
mc policy get myminio/ai-images
```

应该看到类似输出：

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

## Next.js 图片优化配置

如果使用 Next.js 的 `<Image>` 组件，需要配置外部图片域名。

在 `next.config.js` 中添加：

```javascript
module.exports = {
  images: {
    domains: ['123.57.16.107'],
    // 或者使用 remotePatterns（推荐）
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '123.57.16.107',
        port: '9000',
        pathname: '/ai-images/**',
      },
    ],
  },
};
```

## 常见问题

### Q1: 运行脚本后仍然 403

**A**: 检查以下几点：
1. MinIO 服务是否正常运行
2. 防火墙是否开放 9000 端口
3. 访问 MinIO 控制台确认文件确实存在
4. 清除浏览器缓存

### Q2: 数据库更新后前端仍显示旧图片

**A**: 
1. 清除浏览器缓存（Ctrl + Shift + R）
2. 重启开发服务器
3. 检查前端是否有缓存机制

### Q3: 部分图片正常，部分 403

**A**: 
1. 可能是不同时期上传的，URL 格式不同
2. 运行 `refresh-image-urls.ts` 脚本统一处理
3. 检查是否有多个 bucket，确保都设置了公共读

### Q4: 生产环境安全性问题

**A**: 
1. 使用 CDN 隐藏真实 MinIO 地址
2. 配置 CORS 限制访问来源
3. 使用签名 URL + 适当的过期时间
4. 考虑敏感图片不使用公共读

## 监控和日志

### 检查 MinIO 日志

```bash
# 查看 MinIO 日志
journalctl -u minio -f

# 或者
tail -f /var/log/minio/minio.log
```

### 检查访问统计

```bash
mc admin trace myminio
```

## 性能优化建议

1. **使用 CDN**：减少源站压力，提升访问速度
2. **图片压缩**：上传前压缩图片，减少存储和带宽
3. **缓存策略**：设置合理的浏览器缓存时间
4. **分布式存储**：考虑使用 MinIO 集群模式

## 总结

推荐的解决流程：

1. ✅ 运行 `fix-minio-bucket-policy.ts` 设置公共读
2. ✅ 运行 `refresh-image-urls.ts` 刷新旧 URL
3. ✅ 修改代码默认使用公共 URL（已完成）
4. ✅ 配置 Next.js 图片域名白名单
5. 🎯 生产环境配置 CDN（可选但推荐）

## 相关文件

- `app/lib/minio-client.ts` - MinIO 客户端封装
- `scripts/fix-minio-bucket-policy.ts` - Bucket 权限修复脚本
- `scripts/refresh-image-urls.ts` - URL 刷新脚本
- `next.config.js` - Next.js 配置

## 参考资料

- [MinIO 官方文档](https://min.io/docs/minio/linux/index.html)
- [MinIO Bucket 策略配置](https://min.io/docs/minio/linux/administration/identity-access-management/policy-based-access-control.html)
- [Next.js 图片优化](https://nextjs.org/docs/pages/api-reference/components/image)



