# 图片显示问题调试和修复

## 问题描述
用户在仪表盘查看项目详情时显示0张图片，但实际上应该有生成的图片。

## 问题分析

### 1. 数据查询问题 ✅ 已修复
**问题**: `useProjects` hook 中查询 generations 时缺少关键字段
- 缺少 `is_shared_to_gallery` 字段
- 缺少 `high_res_images` 字段

**修复**: 在 `app/hooks/useProjects.ts` 中添加了缺失的字段：
```typescript
generations!left (
  id,
  status,
  preview_images,
  high_res_images,        // 新增
  is_shared_to_gallery,   // 新增
  completed_at,
  created_at,
  template_id,
  template:templates (
    id,
    name,
    preview_image_url
  )
)
```

### 2. 生成服务错误处理 ✅ 已改进
**问题**: AI 生成服务可能失败，但没有适当的回退机制
- 当 AI 服务返回的内容中没有图片时，直接抛出错误
- 没有调试信息来跟踪生成过程

**修复**: 在 `app/lib/generation-service.ts` 中添加了：
1. **回退机制**: 当 AI 服务失败时，使用 mock 生成器作为回退
2. **调试日志**: 添加详细的日志信息跟踪生成过程
3. **错误处理**: 改进数据库更新的错误处理

```typescript
if (!base64ImageMatch) {
  console.error('未在AI响应中找到图片，内容:', content);
  // 使用mock生成器作为回退
  const mockImages = await mockGenerateImages({
    input: input.photos[0],
    variants: 1,
    watermark: '生成失败·回退模式'
  });
  
  if (mockImages.length > 0) {
    // 保存回退生成的图片
    // ...
  }
}
```

### 3. 调试信息 ✅ 已添加
**添加内容**:
- 在仪表盘页面添加项目调试信息输出
- 在生成服务中添加详细的过程日志
- 创建测试数据 API 用于验证显示逻辑

## 可能的根本原因

### 1. AI 服务配置问题
如果 `IMAGE_API_KEY` 未正确配置或 AI 服务不可用，会导致：
- 生成过程失败
- 没有图片返回
- 数据库中 `preview_images` 字段为空

### 2. 网络或存储问题
- 图片上传到 MinIO 失败
- 预签名 URL 生成失败
- 网络连接问题

### 3. 数据库事务问题
- 生成记录创建成功但更新失败
- 并发访问导致的数据不一致

## 调试步骤

### 1. 检查现有数据
```sql
-- 查看用户的项目和生成记录
SELECT 
  p.id as project_id,
  p.name as project_name,
  g.id as generation_id,
  g.status,
  g.preview_images,
  g.is_shared_to_gallery,
  g.created_at
FROM projects p
LEFT JOIN generations g ON g.project_id = p.id
WHERE p.user_id = 'your-user-id'
ORDER BY p.created_at DESC;
```

### 2. 创建测试数据
使用开发环境的测试 API：
```bash
curl -X POST http://localhost:3000/api/test-data \
  -H "Content-Type: application/json" \
  -d '{"action": "create_test_project", "userId": "your-user-id"}'
```

### 3. 查看浏览器控制台
- 打开仪表盘页面
- 查看控制台中的"项目调试信息"输出
- 检查是否有错误信息

## 解决方案

### 立即可用的修复
1. ✅ 修复了数据查询缺失字段的问题
2. ✅ 添加了 AI 服务失败的回退机制
3. ✅ 改进了错误处理和日志记录

### 长期改进建议
1. **监控和告警**: 添加生成失败的监控
2. **重试机制**: 实现自动重试失败的生成
3. **缓存策略**: 缓存成功的生成结果
4. **用户反馈**: 在 UI 中显示更详细的错误信息

## 测试验证

### 1. 游客模式测试
- 不登录，直接在创建页面生成图片
- 应该能看到 mock 生成的预览图

### 2. 登录模式测试
- 登录后创建项目并生成
- 如果 AI 服务不可用，应该看到回退生成的图片
- 在仪表盘中应该能看到生成的图片

### 3. 数据库验证
- 检查 generations 表中的 preview_images 字段
- 确认数据正确存储

## 文件修改清单

### 修改的文件
- `app/hooks/useProjects.ts` - 添加缺失的查询字段
- `app/lib/generation-service.ts` - 改进错误处理和回退机制
- `app/components/DashboardPage.tsx` - 添加调试信息

### 新增的文件
- `app/api/test-data/route.ts` - 测试数据创建 API
- `DEBUG_IMAGES_ISSUE.md` - 本调试文档

## 下一步行动

1. **验证修复**: 测试创建新项目并查看是否显示图片
2. **检查现有数据**: 查看数据库中是否有遗留的空数据
3. **监控日志**: 观察生成过程的日志输出
4. **用户反馈**: 收集用户使用情况的反馈

如果问题仍然存在，请检查：
1. 浏览器控制台的调试信息
2. 服务器日志中的生成过程记录
3. 数据库中的实际数据内容
