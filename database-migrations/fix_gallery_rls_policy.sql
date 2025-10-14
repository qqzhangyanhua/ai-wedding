-- ================================================================
-- 修复画廊 RLS 权限问题
-- ================================================================
-- 问题：画廊页面需要显示所有用户分享的作品，但现有 RLS 策略只允许用户查看自己的数据
-- 解决：添加公开访问策略，允许所有认证用户查看已分享到画廊的作品
-- ================================================================

-- 1. 检查当前 generations 表的 RLS 策略
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE
    WHEN length(qual) > 100 THEN substring(qual, 1, 100) || '...'
    ELSE qual
  END as qual_preview
FROM pg_policies
WHERE tablename = 'generations'
ORDER BY policyname;

-- 2. 删除可能存在的旧画廊策略（如果有）
DROP POLICY IF EXISTS "Gallery items are publicly viewable" ON generations;
DROP POLICY IF EXISTS "Public gallery access" ON generations;
DROP POLICY IF EXISTS "Shared generations are viewable" ON generations;

-- 3. 添加新的画廊公开访问策略
-- 此策略允许所有认证用户查看已分享到画廊的已完成作品
CREATE POLICY "Gallery shared items are viewable by all authenticated users"
ON generations
FOR SELECT
TO authenticated
USING (
  is_shared_to_gallery = true
  AND status = 'completed'
);

-- 4. 验证策略是否生效
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'generations'
  AND policyname LIKE '%gallery%'
  OR policyname LIKE '%shared%';

-- 5. 检查符合画廊条件的数据量
SELECT
  COUNT(*) as total_gallery_items,
  COUNT(CASE WHEN jsonb_array_length(preview_images) > 0 THEN 1 END) as with_images
FROM generations
WHERE is_shared_to_gallery = true
  AND status = 'completed';

-- 6. 查看画廊数据样例（最新 5 条）
SELECT
  g.id,
  g.status,
  g.is_shared_to_gallery,
  jsonb_array_length(g.preview_images) as image_count,
  p.name as project_name,
  t.name as template_name,
  pr.full_name as user_name,
  g.created_at
FROM generations g
LEFT JOIN projects p ON g.project_id = p.id
LEFT JOIN templates t ON g.template_id = t.id
LEFT JOIN profiles pr ON g.user_id = pr.id
WHERE g.is_shared_to_gallery = true
  AND g.status = 'completed'
ORDER BY g.created_at DESC
LIMIT 5;

-- ================================================================
-- 额外检查：确保关联表也有正确的权限
-- ================================================================

-- 检查 projects 表的 RLS 策略（画廊需要读取项目名称）
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'projects';

-- 检查 templates 表的 RLS 策略（画廊需要读取模板名称）
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'templates';

-- 检查 profiles 表的 RLS 策略（画廊需要读取用户名称）
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- ================================================================
-- 如果关联表权限有问题，添加以下策略
-- ================================================================

-- profiles 表：允许读取其他用户的公开信息（full_name, avatar_url）
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
CREATE POLICY "Public profiles are viewable"
ON profiles
FOR SELECT
TO authenticated
USING (true); -- 允许所有认证用户查看所有用户的公开信息

-- 注意：这不会暴露敏感信息，因为 profiles 表只包含公开字段
-- 如果担心隐私，可以限制为只返回部分字段，但需要在应用层实现

-- ================================================================
-- 执行完毕后的验证步骤
-- ================================================================
-- 1. 在 Supabase SQL Editor 中执行本文件
-- 2. 检查输出确认策略已创建
-- 3. 刷新画廊页面或调用 API：GET /api/gallery?page=1&limit=5
-- 4. 应该能看到已分享的作品
-- ================================================================
