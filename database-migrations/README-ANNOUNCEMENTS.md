# 系统公告数据库迁移说明

## 问题诊断

如果 `/api/announcements` 接口无法查询到数据，但 `/api/admin/announcements` 可以查询到，这是 **RLS（行级安全）策略配置问题**。

### 问题原因

- `/api/admin/announcements` 使用管理员的 access_token，有完整权限
- `/api/announcements` 使用 anon key（匿名密钥），需要明确的 RLS 策略允许

Supabase 的 RLS 策略默认拒绝所有访问，必须明确指定 `TO anon, authenticated` 才能允许匿名用户访问。

## 解决方案

### 方案 1：如果是首次安装

直接在 Supabase SQL Editor 中执行：

```sql
database-migrations/create-system-announcements.sql
```

此文件已包含正确的 RLS 策略配置。

### 方案 2：如果已经安装了旧版本

在 Supabase SQL Editor 中执行修复脚本：

```sql
database-migrations/fix-announcements-rls.sql
```

此脚本会：
1. 删除旧的策略
2. 创建新的策略，明确允许 `anon` 和 `authenticated` 角色访问
3. 显示修复后的策略列表

## 验证修复

执行以下 SQL 验证策略是否正确：

```sql
-- 查看所有策略
SELECT 
  policyname, 
  roles::text, 
  cmd,
  qual as condition
FROM pg_policies 
WHERE tablename = 'system_announcements'
ORDER BY policyname;
```

期望输出应包含：

| policyname | roles | cmd | condition |
|-----------|-------|-----|-----------|
| Public can view active announcements | {anon,authenticated} | SELECT | (is_active = true) |
| Admins can view all announcements | {authenticated} | SELECT | (EXISTS (...)) |

**关键点**：`Public can view active announcements` 策略的 `roles` 列必须包含 `{anon,authenticated}`。

## 测试

### 1. 测试管理员接口（需要登录）

```bash
curl -X GET 'https://your-domain.com/api/admin/announcements' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

### 2. 测试公共接口（无需登录）

```bash
curl -X GET 'https://your-domain.com/api/announcements'
```

两个接口都应该返回数据。

## 关键技术点

### Supabase RLS 策略语法

```sql
-- ❌ 错误：没有指定角色，默认只允许 authenticated
CREATE POLICY "policy_name"
  ON table_name
  FOR SELECT
  USING (condition);

-- ✅ 正确：明确指定允许 anon 和 authenticated
CREATE POLICY "policy_name"
  ON table_name
  FOR SELECT
  TO anon, authenticated
  USING (condition);
```

### 角色说明

- `anon`：未登录用户，使用 anon key 访问
- `authenticated`：已登录用户，使用 access token 访问
- 默认情况下，策略只应用于 `authenticated` 角色

## 相关文件

- `create-system-announcements.sql` - 完整的表创建和策略脚本（已修复）
- `fix-announcements-rls.sql` - RLS 策略修复脚本（用于已安装的情况）
- `../docs/SYSTEM_ANNOUNCEMENT_FEATURE.md` - 完整功能文档

## 常见问题

### Q: 为什么管理员接口能查到数据，公共接口查不到？

A: 管理员接口使用的是用户的 access_token，匹配了 "Admins can view all announcements" 策略。公共接口使用 anon key，需要 "Public can view active announcements" 策略明确允许 `anon` 角色。

### Q: 如何确认策略生效？

A: 在 Supabase Dashboard 中：
1. 进入 Database -> Tables -> system_announcements
2. 点击 "Policies" 标签
3. 查看策略的 "Allowed roles" 列

### Q: 修复后还是查不到数据怎么办？

A: 检查以下几点：
1. 确保数据库中有 `is_active = true` 的记录
2. 清除应用缓存
3. 检查浏览器控制台的错误信息
4. 验证环境变量配置正确

## 更新历史

- 2025-01-05: 初始版本
- 2025-01-05: 修复 RLS 策略，明确允许 anon 角色访问





