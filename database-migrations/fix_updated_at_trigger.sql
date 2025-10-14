-- ================================================================
-- 修复 updated_at 字段缺失问题
-- ================================================================
-- 错误：record "new" has no field "updated_at"
-- 原因：可能有自动更新 updated_at 的 trigger，但 generations 表没有此字段
-- 解决：删除 trigger 或添加字段（推荐添加字段）
-- ================================================================

-- 1. 查看 generations 表当前的列
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'generations'
ORDER BY ordinal_position;

-- 2. 查看是否有 updated_at 相关的 trigger
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'generations';

-- 3. 方案 A：添加 updated_at 字段（推荐）
-- 这样可以跟踪记录的最后修改时间
ALTER TABLE generations ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 4. 创建自动更新 updated_at 的 trigger
-- 先创建函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除旧的 trigger（如果存在）
DROP TRIGGER IF EXISTS set_updated_at ON generations;

-- 创建新的 trigger
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON generations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. 同样为 projects 表添加 updated_at（如果需要）
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP TRIGGER IF EXISTS set_updated_at ON projects;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. 验证列已添加
SELECT
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name IN ('generations', 'projects')
  AND column_name = 'updated_at';

-- 7. 验证 trigger 已创建
SELECT
  event_object_table as table_name,
  trigger_name,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('generations', 'projects')
  AND trigger_name = 'set_updated_at';

-- ================================================================
-- 执行完毕后
-- ================================================================
-- 1. generations 和 projects 表都有了 updated_at 字段
-- 2. 每次 UPDATE 操作会自动更新 updated_at 为当前时间
-- 3. 重新测试生成流程应该可以正常工作
-- ================================================================
