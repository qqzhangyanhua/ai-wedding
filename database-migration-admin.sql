-- Migration: Add Admin Role Support
-- Execute this in Supabase SQL Editor to add admin functionality

-- 1. Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. Add comment for clarity
COMMENT ON COLUMN profiles.role IS 'User role: user or admin';

-- 3. Create admin RLS policy for templates
DROP POLICY IF EXISTS "Admins can manage all templates" ON templates;

CREATE POLICY "Admins can manage all templates" ON templates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 4. Set a user as admin (replace with your email)
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';

-- 5. Verify the changes
-- SELECT id, email, role FROM profiles WHERE role = 'admin';
