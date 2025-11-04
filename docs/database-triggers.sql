-- 自动创建用户 profile 的触发器
-- 在 Supabase SQL Editor 中执行此 SQL

-- 创建触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, credits)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 50);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 为现有用户创建 profile（如果不存在）
INSERT INTO public.profiles (id, email, full_name, credits)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  50 as credits
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- ============================================================
-- 自动同步 generation 状态到 project 状态
-- 消除业务代码中的手动同步逻辑
-- ============================================================

-- 创建触发器函数：generation 状态变化时自动更新 project 状态
CREATE OR REPLACE FUNCTION public.sync_project_status()
RETURNS trigger AS $$
BEGIN
  -- 当 generation 状态更新时，同步到对应的 project
  UPDATE public.projects
  SET
    status = NEW.status,
    updated_at = NEW.updated_at
  WHERE id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS after_generation_status_update ON public.generations;
CREATE TRIGGER after_generation_status_update
  AFTER UPDATE OF status ON public.generations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.sync_project_status();

-- ============================================================
-- 创建积分扣除 RPC 函数（原子操作）
-- 替代客户端代码中的多步操作
-- ============================================================

CREATE OR REPLACE FUNCTION public.deduct_credits(
  user_id UUID,
  amount INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits - amount
  WHERE id = user_id AND credits >= amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION '积分不足或用户不存在';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
