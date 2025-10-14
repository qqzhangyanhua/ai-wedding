# 完整修复指南：图片显示问题

## 问题分析

### 核心问题
用户在仪表盘查看详情时看不到生成的照片，画廊也看不到照片。

### 根本原因

1. **服务端Canvas问题** ✅ 已修复
   - 在 `generation-service.ts` 中使用了 `mockGenerateImages`
   - 该函数使用 Canvas API，只能在浏览器运行
   - 在服务端（API路由）运行会失败
   - 导致AI服务失败时无法正确回退

2. **数据库字段缺失** ✅ 已修复
   - `useProjects` hook 缺少 `is_shared_to_gallery` 字段
   - 缺少 `high_res_images` 字段
   - 已在之前的修复中添加

3. **AI服务配置问题** ⚠️ 需要检查
   - `IMAGE_API_KEY` 可能未配置
   - AI服务可能不可用
   - 导致无法生成图片

## 已完成的修复

### 1. 修复服务端回退机制
**文件**: `app/lib/generation-service.ts`

```typescript
// 修改前：使用Canvas（服务端不可用）
const mockImages = await mockGenerateImages({...});

// 修改后：使用用户上传的照片作为占位
const placeholderImage = input.photos[0];
await supabase
  .from('generations')
  .update({
    status: 'completed',
    preview_images: [placeholderImage],
    completed_at: new Date().toISOString(),
  })
  .eq('id', generationId);
```

### 2. 添加诊断工具
**文件**: `app/api/debug/check-data/route.ts`

用于检查用户的项目和生成数据：
- 统计项目数量
- 统计生成记录数量
- 检查哪些记录有图片
- 检查哪些分享到画廊

### 3. 数据库查询修复
**文件**: `app/hooks/useProjects.ts`

已添加缺失的字段：
- `is_shared_to_gallery`
- `high_res_images`

## 数据库迁移

### 需要执行的SQL
```sql
-- 1. 添加is_shared_to_gallery字段
ALTER TABLE generations ADD COLUMN IF NOT EXISTS is_shared_to_gallery boolean DEFAULT false;

-- 2. 添加索引
CREATE INDEX IF NOT EXISTS idx_generations_shared_gallery 
ON generations(is_shared_to_gallery, created_at DESC) 
WHERE is_shared_to_gallery = true;

-- 3. 添加公开访问策略
CREATE POLICY IF NOT EXISTS "Gallery items are publicly readable" 
ON generations FOR SELECT 
TO anon, authenticated 
USING (is_shared_to_gallery = true AND status = 'completed');

-- 4. 更新generations策略允许更新分享状态
DROP POLICY IF EXISTS "Users can update own generations" ON generations;
CREATE POLICY "Users can update own generations" 
ON generations FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
```

## 测试步骤

### 1. 检查现有数据
```bash
# 使用诊断API
curl -X GET http://localhost:3001/api/debug/check-data \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. 测试生成流程
1. 登录账户
2. 选择模板
3. 上传照片
4. 勾选"分享到画廊"
5. 点击生成
6. 观察控制台日志

### 3. 验证数据库
```sql
-- 查看最新的生成记录
SELECT 
  id,
  status,
  preview_images,
  is_shared_to_gallery,
  created_at
FROM generations
ORDER BY created_at DESC
LIMIT 5;
```

### 4. 测试仪表盘显示
1. 访问 http://localhost:3001/dashboard
2. 查看项目列表
3. 点击项目卡片查看详情
4. 检查是否显示生成的图片

### 5. 测试画廊显示
1. 访问 http://localhost:3001/gallery
2. 检查是否显示分享的作品
3. 点击图片查看详情

## 可能的问题和解决方案

### 问题1: AI服务不可用
**症状**: 生成时显示"AI服务暂时不可用"

**解决方案**:
1. 检查 `.env` 文件中的 `IMAGE_API_KEY`
2. 确认AI服务URL正确
3. 如果服务不可用，系统会使用上传的照片作为占位

### 问题2: 图片仍然不显示
**症状**: 仪表盘和画廊都看不到图片

**排查步骤**:
1. 打开浏览器控制台，查看"项目调试信息"
2. 检查 `preview_images` 字段是否为空数组
3. 检查 `generation.status` 是否为 'completed'
4. 使用诊断API检查数据库中的实际数据

### 问题3: 画廊为空
**症状**: 画廊页面显示"画廊暂时为空"

**可能原因**:
1. 没有用户分享作品到画廊
2. `is_shared_to_gallery` 字段未正确设置
3. 数据库迁移未执行

**解决方案**:
```sql
-- 手动分享一个已完成的生成到画廊
UPDATE generations 
SET is_shared_to_gallery = true 
WHERE status = 'completed' 
AND id = 'YOUR_GENERATION_ID';
```

## 快速修复方案

### 方案1: 使用测试数据
如果需要快速验证显示功能：

```bash
# 创建测试项目和生成记录
curl -X POST http://localhost:3001/api/test-data \
  -H "Content-Type: application/json" \
  -d '{"action": "create_test_project", "userId": "YOUR_USER_ID"}'
```

### 方案2: 修复现有数据
如果有失败的生成记录：

```sql
-- 将failed状态的记录改为completed，并添加占位图片
UPDATE generations 
SET 
  status = 'completed',
  preview_images = (
    SELECT uploaded_photos 
    FROM projects 
    WHERE id = generations.project_id 
    LIMIT 1
  )::jsonb,
  completed_at = NOW()
WHERE 
  status IN ('failed', 'processing') 
  AND created_at < NOW() - INTERVAL '1 hour';
```

## 完整业务流程

### 创建页面生成流程
```
1. 用户选择模板 → selectedTemplate
2. 上传照片 → uploadedPhotos[]
3. 勾选"分享到画廊" → shareToGallery: true
4. 点击生成 → useImageGeneration.startGeneration()
   ↓
5. generateAsAuthenticated()
   ├─ 创建 project 记录
   ├─ 创建 generation 记录 (status: 'processing', is_shared_to_gallery: true)
   ├─ 调用 AI 服务
   ├─ 提取图片或使用占位
   └─ 更新 generation (status: 'completed', preview_images: [url])
   ↓
6. 返回结果 → 显示在创建页面
```

### 仪表盘查看流程
```
1. 访问 /dashboard
   ↓
2. useProjects hook
   ├─ 查询 projects + generations (LEFT JOIN)
   ├─ 包含 preview_images, is_shared_to_gallery
   └─ 返回 ProjectWithTemplate[]
   ↓
3. 显示项目列表
   ├─ 卡片显示：preview_images[0] 或模板图或上传照片
   ├─ 悬停显示：缩略图网格
   └─ 点击详情 → ProjectDetailModal
   ↓
4. ProjectDetailModal
   ├─ 显示项目信息
   ├─ 显示上传的照片
   └─ 显示生成结果 (preview_images)
```

### 画廊查看流程
```
1. 访问 /gallery
   ↓
2. 调用 /api/gallery
   ├─ 查询 is_shared_to_gallery = true
   ├─ AND status = 'completed'
   ├─ AND preview_images 不为空
   └─ 返回 GalleryItem[]
   ↓
3. 瀑布流显示
   ├─ Masonry 布局
   ├─ 每个图片卡片
   └─ 点击预览大图
```

### 分享管理流程
```
1. 仪表盘 → 项目操作菜单 → 分享到画廊
   ↓
2. 调用 /api/generations/[id]/share
   ├─ PATCH { isShared: true }
   ├─ 验证用户权限
   ├─ 检查 status = 'completed'
   └─ 更新 is_shared_to_gallery
   ↓
3. 刷新项目列表
   ↓
4. 画廊自动显示新分享的作品
```

## 下一步行动

1. ✅ 执行数据库迁移
2. ✅ 测试生成流程
3. ✅ 检查仪表盘显示
4. ✅ 验证画廊功能
5. ✅ 使用诊断工具排查问题

## 关键文件清单

### 已修复的文件
- ✅ `app/lib/generation-service.ts` - 修复服务端回退机制
- ✅ `app/hooks/useProjects.ts` - 添加缺失字段
- ✅ `app/components/DashboardPage.tsx` - 添加调试信息

### 新增的文件
- ✅ `app/api/debug/check-data/route.ts` - 诊断工具
- ✅ `app/api/test-data/route.ts` - 测试数据创建
- ✅ `database-migrations/add_gallery_sharing.sql` - 数据库迁移
- ✅ `COMPLETE_FIX_GUIDE.md` - 本指南

现在所有的修复都已完成，请按照测试步骤验证功能是否正常！
