-- ================================================================
-- 修复画廊 RLS 权限问题 V2（允许匿名访问）
-- ================================================================
-- 问题：前端调用 /api/gallery 时没有传递认证 token，所以是匿名请求
-- 原策略只允许 authenticated 用户，导致查询返回空
-- 解决：修改策略允许 anon 角色访问已分享的画廊内容
-- ================================================================

-- 1. 删除旧策略
DROP POLICY IF EXISTS "Gallery shared items are viewable by all authenticated users" ON generations;
DROP POLICY IF EXISTS "Gallery items are publicly viewable" ON generations;
DROP POLICY IF EXISTS "Public gallery access" ON generations;

-- 2. 创建新策略：允许 anon 和 authenticated 角色访问画廊
-- 使用 TO public 表示所有角色（包括 anon 和 authenticated）
CREATE POLICY "Gallery items are publicly viewable"
ON generations
FOR SELECT
TO public  -- 允许所有角色（anon + authenticated）
USING (
  is_shared_to_gallery = true
  AND status = 'completed'
);

-- 3. 同样修改关联表的策略
-- profiles 表：允许匿名用户读取公开信息（用于显示用户名）
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
CREATE POLICY "Public profiles are viewable"
ON profiles
FOR SELECT
TO public
USING (true);

-- 4. projects 表：检查现有策略
SELECT policyname, cmd, roles::text, qual
FROM pg_policies
WHERE tablename = 'projects';

-- 如果 projects 只允许用户查看自己的，需要添加画廊访问策略
DROP POLICY IF EXISTS "Gallery can view projects for shared generations" ON projects;
CREATE POLICY "Gallery can view projects for shared generations"
ON projects
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM generations
    WHERE generations.project_id = projects.id
      AND generations.is_shared_to_gallery = true
      AND generations.status = 'completed'
  )
);

-- 5. templates 表应该已经是公开的，验证一下
SELECT policyname, cmd, roles::text, qual
FROM pg_policies
WHERE tablename = 'templates';

-- 如果 templates 没有公开策略，添加一个
DROP POLICY IF EXISTS "Templates are publicly readable" ON templates;
CREATE POLICY "Templates are publicly readable"
ON templates
FOR SELECT
TO public
USING (is_active = true);

-- ================================================================
-- 验证策略是否生效
-- ================================================================

-- 6. 查看所有相关表的策略
SELECT
  tablename,
  policyname,
  roles::text as roles,
  CASE
    WHEN length(qual) > 80 THEN substring(qual, 1, 80) || '...'
    ELSE qual
  END as condition
FROM pg_policies
WHERE tablename IN ('generations', 'projects', 'templates', 'profiles')
ORDER BY tablename, policyname;

-- 7. 验证数据查询（模拟 anon 角色）
SET ROLE anon;

-- 查询画廊数据（应该返回结果）
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
  AND g.preview_images IS NOT NULL
  AND jsonb_array_length(g.preview_images) > 0
LIMIT 3;

-- 恢复角色
RESET ROLE;

-- ================================================================
-- 执行完毕后的验证步骤
-- ================================================================
-- 1. 在 Supabase SQL Editor 中执行本文件
-- 2. 检查输出确认：
--    - 所有策略已创建
--    - anon 角色查询返回了数据
-- 3. 测试 API：curl 'http://localhost:3000/api/gallery?page=1&limit=5'
-- 4. 刷新画廊页面，应该能看到作品
-- ================================================================
