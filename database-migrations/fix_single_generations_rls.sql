-- 修复 single_generations 表的 RLS 策略和自动设置 user_id

-- 1. 删除旧的插入策略
DROP POLICY IF EXISTS "Users can insert own single generations" ON single_generations;

-- 2. 修改表结构，添加默认值
ALTER TABLE single_generations 
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 3. 创建新的插入策略（允许插入，但会自动设置 user_id）
CREATE POLICY "Users can insert own single generations" 
  ON single_generations 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    -- 如果提供了 user_id，必须是当前用户
    -- 如果没有提供，会使用默认值（auth.uid()）
    CASE 
      WHEN user_id IS NOT NULL THEN user_id = auth.uid()
      ELSE true
    END
  );

-- 4. 创建触发器函数，确保 user_id 总是当前用户
CREATE OR REPLACE FUNCTION set_single_generation_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果 user_id 为空或不是当前用户，设置为当前用户
  IF NEW.user_id IS NULL OR NEW.user_id != auth.uid() THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 创建触发器
DROP TRIGGER IF EXISTS ensure_single_generation_user_id ON single_generations;
CREATE TRIGGER ensure_single_generation_user_id
  BEFORE INSERT ON single_generations
  FOR EACH ROW
  EXECUTE FUNCTION set_single_generation_user_id();

-- 6. 验证策略
-- 测试查询（需要在 Supabase SQL Editor 中以认证用户身份运行）
-- SELECT * FROM single_generations WHERE user_id = auth.uid();

