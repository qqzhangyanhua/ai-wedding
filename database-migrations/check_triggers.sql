-- 检查 generations 表的 triggers
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'generations';

-- 检查是否有自动更新 updated_at 的函数
SELECT proname, prosrc
FROM pg_proc
WHERE proname LIKE '%update%time%'
   OR proname LIKE '%updated_at%';

-- 查看 generations 表的实际列
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'generations'
ORDER BY ordinal_position;

-- 删除可能存在的 updated_at trigger（如果有）
DROP TRIGGER IF EXISTS set_updated_at ON generations;
DROP TRIGGER IF EXISTS handle_updated_at ON generations;
DROP TRIGGER IF EXISTS update_updated_at_column ON generations;
