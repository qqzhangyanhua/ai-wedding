-- ================================================================
-- 最终修复：直接禁用 generations 的 RLS 或添加最宽松的策略
-- ================================================================

-- 方案 A：暂时禁用 RLS（仅用于测试）
-- ALTER TABLE generations DISABLE ROW LEVEL SECURITY;

-- 方案 B：添加最宽松的策略（推荐）

-- 1. 查看当前所有策略
SELECT policyname FROM pg_policies WHERE tablename = 'generations';

-- 2. 删除 generations 表的所有策略
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'generations')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON generations', r.policyname);
    END LOOP;
END $$;

-- 3. 验证删除成功
SELECT COUNT(*) as remaining_policies FROM pg_policies WHERE tablename = 'generations';

-- 4. 创建超级简单的策略：允许所有角色读取已分享的内容
CREATE POLICY "allow_all_read_shared"
ON generations
FOR SELECT
USING (is_shared_to_gallery = true);

-- 注意：不指定 TO 子句，默认适用于所有角色（PUBLIC）

-- 5. 验证策略已创建
SELECT
    policyname,
    roles::text,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'generations';

-- 6. 测试 anon 角色（关键测试）
SET ROLE anon;
SELECT COUNT(*) as count_as_anon FROM generations;
SELECT COUNT(*) as shared_as_anon FROM generations WHERE is_shared_to_gallery = true;
RESET ROLE;

-- 7. 同样修复关联表
-- profiles
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND policyname LIKE '%anon%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
    END LOOP;
END $$;

CREATE POLICY "allow_all_read_profiles"
ON profiles
FOR SELECT
USING (true);

-- projects
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'projects' AND policyname LIKE '%anon%' OR policyname LIKE '%gallery%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON projects', r.policyname);
    END LOOP;
END $$;

CREATE POLICY "allow_all_read_projects"
ON projects
FOR SELECT
USING (true);

-- templates（应该已经有了，但确保一下）
DROP POLICY IF EXISTS "allow_all_read_templates" ON templates;
CREATE POLICY "allow_all_read_templates"
ON templates
FOR SELECT
USING (is_active = true);

-- 8. 最终测试
SET ROLE anon;
SELECT
    g.id,
    g.status,
    g.is_shared_to_gallery,
    p.name as project_name,
    t.name as template_name,
    pr.full_name as user_name
FROM generations g
LEFT JOIN projects p ON g.project_id = p.id
LEFT JOIN templates t ON g.template_id = t.id
LEFT JOIN profiles pr ON g.user_id = pr.id
WHERE g.is_shared_to_gallery = true
LIMIT 3;

RESET ROLE;

-- 如果上面的查询返回了数据，说明成功！
