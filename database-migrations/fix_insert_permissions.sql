-- ================================================================
-- 修复 INSERT 权限问题
-- ================================================================
-- 错误：new row violates row-level security policy for table "generations"
-- 原因：只修复了 SELECT 权限，用户无法 INSERT 新记录
-- 解决：添加 INSERT 策略
-- ================================================================

-- 1. 查看当前 generations 表的所有策略
SELECT
  policyname,
  cmd,
  roles::text,
  CASE
    WHEN length(qual) > 60 THEN substring(qual, 1, 60) || '...'
    ELSE qual
  END as using_clause
FROM pg_policies
WHERE tablename = 'generations'
ORDER BY cmd, policyname;

-- 2. 为 authenticated 用户添加 INSERT 权限
-- 用户只能插入自己的记录
DROP POLICY IF EXISTS "authenticated_can_insert_own_generations" ON generations;
CREATE POLICY "authenticated_can_insert_own_generations"
ON generations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. 为 authenticated 用户添加 UPDATE 权限
-- 用户只能更新自己的记录
DROP POLICY IF EXISTS "authenticated_can_update_own_generations" ON generations;
CREATE POLICY "authenticated_can_update_own_generations"
ON generations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. 同样修复 projects 表
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'projects';

DROP POLICY IF EXISTS "authenticated_can_insert_own_projects" ON projects;
CREATE POLICY "authenticated_can_insert_own_projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "authenticated_can_update_own_projects" ON projects;
CREATE POLICY "authenticated_can_update_own_projects"
ON projects
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. 验证所有策略
SELECT
  tablename,
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE tablename IN ('generations', 'projects')
ORDER BY tablename, cmd, policyname;

-- 6. 测试 INSERT（需要在应用层测试，SQL Editor 无法模拟 auth.uid()）
-- 应用层测试：访问 /create 页面，创建新项目并生成图片

-- ================================================================
-- 执行完毕后
-- ================================================================
-- 1. 在 Supabase SQL Editor 中执行本文件
-- 2. 访问 /create 页面
-- 3. 上传照片，勾选"分享到画廊"
-- 4. 点击生成，应该可以成功创建记录
-- ================================================================
