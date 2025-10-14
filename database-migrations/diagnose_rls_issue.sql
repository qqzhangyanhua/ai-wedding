-- ================================================================
-- 诊断 RLS 策略问题
-- ================================================================
-- 数据库有 17 条 generations 记录，但 API 查询返回 0
-- 这说明 RLS 策略阻止了查询
-- ================================================================

-- 1. 检查 generations 表的 RLS 是否启用
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'generations';

-- 2. 查看当前所有 RLS 策略
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  qual as condition,
  with_check
FROM pg_policies
WHERE tablename = 'generations'
ORDER BY policyname;

-- 3. 查看实际数据（绕过 RLS）
SET ROLE postgres;
SELECT
  id,
  status,
  is_shared_to_gallery,
  user_id,
  project_id,
  template_id,
  jsonb_array_length(preview_images) as image_count,
  created_at
FROM generations
ORDER BY created_at DESC
LIMIT 5;

-- 4. 统计数据分布
SELECT
  status,
  is_shared_to_gallery,
  COUNT(*) as count
FROM generations
GROUP BY status, is_shared_to_gallery
ORDER BY count DESC;

-- 5. 测试 anon 角色能否查询（这是关键！）
SET ROLE anon;
SELECT COUNT(*) as visible_to_anon FROM generations;

-- 6. 测试 anon 角色能否查询已分享的
SELECT COUNT(*) as shared_visible_to_anon
FROM generations
WHERE is_shared_to_gallery = true;

-- 恢复角色
RESET ROLE;

-- ================================================================
-- 修复方案：确保 anon 角色可以访问画廊
-- ================================================================

-- 7. 删除所有旧的画廊策略
DROP POLICY IF EXISTS "Gallery items are publicly viewable" ON generations;
DROP POLICY IF EXISTS "Gallery shared items are viewable by all authenticated users" ON generations;
DROP POLICY IF EXISTS "Public gallery access" ON generations;
DROP POLICY IF EXISTS "Shared generations are viewable" ON generations;

-- 8. 创建新策略：明确允许 anon 和 authenticated 访问已分享内容
CREATE POLICY "anon_can_view_shared_gallery"
ON generations
FOR SELECT
TO anon
USING (
  is_shared_to_gallery = true
  AND status = 'completed'
);

CREATE POLICY "authenticated_can_view_shared_gallery"
ON generations
FOR SELECT
TO authenticated
USING (
  is_shared_to_gallery = true
  AND status = 'completed'
);

-- 9. 验证策略是否生效
SET ROLE anon;
SELECT
  g.id,
  g.status,
  g.is_shared_to_gallery,
  jsonb_array_length(g.preview_images) as img_count
FROM generations g
WHERE g.is_shared_to_gallery = true
  AND g.status = 'completed'
LIMIT 3;

RESET ROLE;

-- 10. 检查关联表的 RLS 策略
-- projects 表
SELECT policyname, roles::text, cmd
FROM pg_policies
WHERE tablename = 'projects';

-- profiles 表
SELECT policyname, roles::text, cmd
FROM pg_policies
WHERE tablename = 'profiles';

-- templates 表
SELECT policyname, roles::text, cmd
FROM pg_policies
WHERE tablename = 'templates';

-- 11. 为关联表添加 anon 访问权限
-- profiles: 允许 anon 读取公开信息
DROP POLICY IF EXISTS "anon_can_view_public_profiles" ON profiles;
CREATE POLICY "anon_can_view_public_profiles"
ON profiles
FOR SELECT
TO anon
USING (true);

-- projects: 允许 anon 读取有已分享 generations 的项目
DROP POLICY IF EXISTS "anon_can_view_shared_projects" ON projects;
CREATE POLICY "anon_can_view_shared_projects"
ON projects
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM generations
    WHERE generations.project_id = projects.id
      AND generations.is_shared_to_gallery = true
      AND generations.status = 'completed'
  )
);

-- templates: 应该已经是公开的
DROP POLICY IF EXISTS "anon_can_view_templates" ON templates;
CREATE POLICY "anon_can_view_templates"
ON templates
FOR SELECT
TO anon
USING (is_active = true);

-- 12. 最终测试：模拟 API 查询
SET ROLE anon;
SELECT
  g.id,
  g.preview_images,
  g.created_at,
  p.name as project_name,
  t.name as template_name,
  pr.full_name as user_name
FROM generations g
LEFT JOIN projects p ON g.project_id = p.id
LEFT JOIN templates t ON g.template_id = t.id
LEFT JOIN profiles pr ON g.user_id = pr.id
WHERE g.is_shared_to_gallery = true
  AND g.status = 'completed'
ORDER BY g.created_at DESC
LIMIT 3;

RESET ROLE;

-- ================================================================
-- 执行完毕后，最后一个查询应该返回数据
-- 如果返回了数据，说明修复成功
-- ================================================================
