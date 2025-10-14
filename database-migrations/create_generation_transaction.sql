-- ============================================
-- Supabase 存储过程：原子性创建生成记录并扣除积分
-- 解决 generation-service.ts 中的事务问题
-- ============================================

-- 首先创建自定义错误类型（如果需要）
DO $$ BEGIN
  CREATE TYPE generation_error AS ENUM (
    'insufficient_credits',
    'template_not_found',
    'user_not_found'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 主存储过程
CREATE OR REPLACE FUNCTION create_generation_with_deduct(
  p_user_id uuid,
  p_project_name text,
  p_uploaded_photos text[],
  p_template_id uuid,
  p_credits_to_deduct int
) RETURNS jsonb AS $$
DECLARE
  v_project_id uuid;
  v_generation_id uuid;
  v_current_credits int;
BEGIN
  -- 1. 检查用户是否存在
  SELECT credits INTO v_current_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE; -- 锁定行，防止并发修改

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id
      USING ERRCODE = 'P0001', HINT = 'user_not_found';
  END IF;

  -- 2. 检查积分是否足够
  IF v_current_credits < p_credits_to_deduct THEN
    RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %',
      p_credits_to_deduct, v_current_credits
      USING ERRCODE = 'P0002', HINT = 'insufficient_credits';
  END IF;

  -- 3. 原子性扣除积分
  UPDATE profiles
  SET credits = credits - p_credits_to_deduct,
      updated_at = now()
  WHERE id = p_user_id;

  -- 4. 创建项目记录
  INSERT INTO projects (user_id, name, status, uploaded_photos, created_at, updated_at)
  VALUES (
    p_user_id,
    p_project_name,
    'processing',
    p_uploaded_photos,
    now(),
    now()
  ) RETURNING id INTO v_project_id;

  -- 5. 创建生成记录
  INSERT INTO generations (
    project_id,
    user_id,
    template_id,
    status,
    credits_used,
    preview_images,
    high_res_images,
    created_at
  )
  VALUES (
    v_project_id,
    p_user_id,
    p_template_id,
    'processing',
    p_credits_to_deduct,
    '{}',
    '{}',
    now()
  ) RETURNING id INTO v_generation_id;

  -- 6. 返回结果
  RETURN jsonb_build_object(
    'success', true,
    'project_id', v_project_id,
    'generation_id', v_generation_id,
    'credits_remaining', v_current_credits - p_credits_to_deduct
  );

EXCEPTION
  WHEN OTHERS THEN
    -- 任何错误都会自动回滚整个事务
    RAISE EXCEPTION 'Transaction failed: %', SQLERRM
      USING ERRCODE = SQLSTATE, HINT = 'transaction_failed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON FUNCTION create_generation_with_deduct IS '
原子性创建生成记录并扣除用户积分。
此函数确保以下操作在同一事务中完成：
1. 检查并锁定用户积分
2. 扣除积分
3. 创建项目记录
4. 创建生成记录

如果任何步骤失败，所有更改会自动回滚。
';

-- ============================================
-- 辅助函数：回滚失败的生成
-- ============================================

CREATE OR REPLACE FUNCTION refund_failed_generation(
  p_generation_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_credits_used int;
  v_status text;
BEGIN
  -- 1. 获取生成记录信息
  SELECT user_id, credits_used, status
  INTO v_user_id, v_credits_used, v_status
  FROM generations
  WHERE id = p_generation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Generation not found: %', p_generation_id;
  END IF;

  -- 2. 只有 failed 状态才能退款
  IF v_status != 'failed' THEN
    RAISE EXCEPTION 'Cannot refund generation with status: %', v_status;
  END IF;

  -- 3. 退还积分
  UPDATE profiles
  SET credits = credits + v_credits_used,
      updated_at = now()
  WHERE id = v_user_id;

  -- 4. 标记为已退款
  UPDATE generations
  SET error_message = COALESCE(error_message, '') || ' [Refunded]',
      updated_at = now()
  WHERE id = p_generation_id;

  RETURN jsonb_build_object(
    'success', true,
    'generation_id', p_generation_id,
    'refunded_credits', v_credits_used
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Refund failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refund_failed_generation IS '
退还失败生成的积分。
只能对 status = failed 的记录执行。
';

-- ============================================
-- 权限设置
-- ============================================

-- 允许认证用户��用这些函数
GRANT EXECUTE ON FUNCTION create_generation_with_deduct TO authenticated;
GRANT EXECUTE ON FUNCTION refund_failed_generation TO authenticated;

-- 如果需要从 API 端（使用 service role）调用
GRANT EXECUTE ON FUNCTION create_generation_with_deduct TO service_role;
GRANT EXECUTE ON FUNCTION refund_failed_generation TO service_role;
