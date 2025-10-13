-- 仅执行“新增”部分的增量脚本（可重复执行，具幂等性）
-- 目标：邀请字段 + 邀请事件表 + RLS 策略

-- 1) profiles 表新增字段（若不存在）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_code text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invited_by text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reward_credits integer DEFAULT 0;

-- 为邀请码创建唯一索引（忽略 NULL）
CREATE UNIQUE INDEX IF NOT EXISTS profiles_invite_code_key
ON profiles (invite_code) WHERE invite_code IS NOT NULL;

-- 2) 邀请事件表
CREATE TABLE IF NOT EXISTS invite_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  invitee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  inviter_code text,
  reward_credits integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invite_events ENABLE ROW LEVEL SECURITY;

-- RLS 策略（如果不存在则创建）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'invite_events' 
      AND policyname = 'Users can view own invite events'
  ) THEN
    CREATE POLICY "Users can view own invite events" ON invite_events
      FOR SELECT TO authenticated
      USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);
  END IF;
END $$;

-- 3) （可选）一次性为已有用户回填邀请码（避免重复，概率极低；如需更稳妥可分批执行）
-- 注意：如果用户量很大且并发写多，建议维护窗口执行
-- UPDATE profiles p SET invite_code = v.code FROM (
--   SELECT id, upper(substr(encode(gen_random_bytes(16),'hex'),1,6)) AS code
--   FROM profiles WHERE invite_code IS NULL
-- ) v WHERE p.id = v.id;

