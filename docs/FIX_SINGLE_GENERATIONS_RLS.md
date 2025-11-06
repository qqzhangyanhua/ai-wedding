# 修复 single_generations 表 RLS 策略问题

## 问题描述

插入 `single_generations` 表时出现错误：
```json
{
  "code": "42501",
  "details": null,
  "hint": null,
  "message": "new row violates row-level security policy for table \"single_generations\""
}
```

## 原因分析

1. `user_id` 字段定义为 `NOT NULL`
2. 前端插入时没有传递 `user_id`
3. RLS 策略检查 `user_id = auth.uid()`，但 `user_id` 为空，导致验证失败

## 解决方案

我们提供了两个解决方案，**推荐使用方案 1**。

### 方案 1：数据库触发器（推荐）✅

**优点**：
- 更安全，数据库层面保证数据完整性
- 前端代码更简洁
- 防止恶意用户篡改 user_id

**步骤**：

1. 在 Supabase SQL Editor 中执行：
   ```sql
   -- 执行文件：database-migrations/fix_single_generations_rls.sql
   ```

2. 验证修复：
   ```sql
   -- 测试插入（应该成功）
   INSERT INTO single_generations (prompt, original_image, result_image, settings, credits_used)
   VALUES ('test prompt', 'test_original.jpg', 'test_result.jpg', '{}', 15);
   
   -- 查看结果（user_id 应该自动设置为当前用户）
   SELECT * FROM single_generations ORDER BY created_at DESC LIMIT 1;
   ```

### 方案 2：前端显式传递 user_id（已实现）✅

**优点**：
- 简单直接
- 不需要修改数据库

**已修改的文件**：
- `app/hooks/useStreamImageGeneration.ts`

**改动内容**：
```typescript
// 获取当前用户 ID
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  console.warn('无法获取用户信息，跳过保存到数据库');
  return;
}

// 插入时显式传递 user_id
const { error: dbError } = await supabase
  .from('single_generations')
  .insert({
    user_id: user.id,  // ← 添加这一行
    prompt: prompt,
    original_image: originalImage,
    result_image: resultImageUrl,
    settings: { ... },
    credits_used: 15,
  });
```

## 快速修复步骤

### 选择方案 1（推荐）

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `database-migrations/fix_single_generations_rls.sql` 的内容
4. 点击 "Run" 执行
5. 重启前端开发服务器
6. 测试单张生成功能

### 选择方案 2（已实现）

前端代码已经修改完成，只需要：

1. 确保前端代码已更新
2. 重启开发服务器：`npm run dev`
3. 测试单张生成功能

## 验证修复

### 1. 测试生成功能

1. 访问 `/generate-single`
2. 上传图片并生成
3. 检查浏览器控制台：
   - ✅ 应该看到："生成记录已保存到数据库"
   - ❌ 不应该看到 RLS 错误

### 2. 检查数据库

在 Supabase SQL Editor 中：

```sql
-- 查看最新记录
SELECT 
  id,
  user_id,
  LEFT(prompt, 50) as prompt_preview,
  credits_used,
  created_at
FROM single_generations
ORDER BY created_at DESC
LIMIT 5;

-- 验证 user_id 是否正确
SELECT 
  sg.id,
  sg.user_id,
  p.email,
  sg.created_at
FROM single_generations sg
LEFT JOIN auth.users u ON u.id = sg.user_id
LEFT JOIN profiles p ON p.id = sg.user_id
ORDER BY sg.created_at DESC
LIMIT 5;
```

### 3. 检查 Dashboard

1. 访问 `/dashboard`
2. 切换到"单张生成"标签页
3. 应该能看到刚才生成的记录

## 常见问题

### Q1: 执行 SQL 后仍然报错？

**A**: 检查以下几点：
1. 确认 SQL 执行成功（没有错误提示）
2. 刷新浏览器页面
3. 重新登录
4. 检查是否使用了正确的 Supabase 项目

### Q2: 看到 "无法获取用户信息" 警告？

**A**: 这说明用户未登录或 session 过期：
1. 确认已登录
2. 刷新页面重新登录
3. 检查 Supabase 配置是否正确

### Q3: 数据库中有记录但 Dashboard 不显示？

**A**: 检查以下几点：
1. 确认 `user_id` 字段正确
2. 刷新 Dashboard 页面
3. 检查浏览器控制台是否有错误
4. 验证 RLS 策略：
   ```sql
   SELECT * FROM single_generations WHERE user_id = auth.uid();
   ```

### Q4: 两个方案可以同时使用吗？

**A**: 可以！方案 1 的触发器会确保 `user_id` 总是正确的，即使前端传了错误的值。这提供了双重保护。

## 推荐配置

**最佳实践**：同时使用两个方案

1. **数据库层面**：执行 `fix_single_generations_rls.sql`
   - 提供最后一道防线
   - 防止数据不一致

2. **前端层面**：显式传递 `user_id`（已实现）
   - 更明确的代码意图
   - 更容易调试

## 安全性说明

### RLS 策略保护

即使前端代码被篡改，数据库层面的保护仍然有效：

1. **SELECT**: 只能查看自己的记录
2. **INSERT**: 触发器强制设置为当前用户
3. **DELETE**: 只能删除自己的记录

### 测试安全性

```sql
-- 尝试插入其他用户的记录（应该失败或被修正）
INSERT INTO single_generations (user_id, prompt, original_image, result_image)
VALUES ('00000000-0000-0000-0000-000000000000', 'test', 'test.jpg', 'test.jpg');

-- 查看结果（user_id 应该是当前用户，不是上面的假 ID）
SELECT user_id FROM single_generations ORDER BY created_at DESC LIMIT 1;
```

## 总结

- ✅ 前端代码已修改（方案 2）
- ✅ 数据库迁移文件已创建（方案 1）
- ✅ 两个方案都可以独立工作
- ✅ 推荐同时使用以获得最佳安全性

选择你喜欢的方案，或者两个都用！

