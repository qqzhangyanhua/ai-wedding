-- AI Wedding Photo Platform - Database Schema
-- Apply this schema to your Supabase database through the SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  credits integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  preview_image_url text,
  prompt_config jsonb DEFAULT '{}',
  price_credits integer DEFAULT 10,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are publicly readable" ON templates FOR SELECT TO authenticated USING (is_active = true);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'draft',
  uploaded_photos jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create generations table
CREATE TABLE IF NOT EXISTS generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES templates(id) ON DELETE SET NULL,
  status text DEFAULT 'pending',
  preview_images jsonb DEFAULT '[]',
  high_res_images jsonb DEFAULT '[]',
  error_message text,
  credits_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations" ON generations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own generations" ON generations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  generation_id uuid REFERENCES generations(id) ON DELETE SET NULL,
  amount decimal(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending',
  payment_method text,
  payment_intent_id text,
  purchased_images jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES templates(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, template_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_project_id ON generations(project_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);

-- Insert sample templates
INSERT INTO templates (name, description, category, price_credits, sort_order, preview_image_url) VALUES
('Paris Romance', 'Classic wedding photos with Eiffel Tower backdrop, romantic sunset lighting', 'location', 10, 1, 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg'),
('Santorini Dreams', 'White-washed buildings and azure seas of Greece', 'location', 10, 2, 'https://images.pexels.com/photos/161764/santorini-travel-holiday-vacation-161764.jpeg'),
('Cherry Blossom Tokyo', 'Traditional Japanese garden with spring sakura flowers', 'location', 10, 3, 'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg'),
('Iceland Aurora', 'Magical northern lights and dramatic volcanic landscapes', 'location', 15, 4, 'https://images.pexels.com/photos/1933239/pexels-photo-1933239.jpeg'),
('Fairytale Castle', 'Enchanted castle setting with magical golden hour lighting', 'fantasy', 15, 5, 'https://images.pexels.com/photos/1603650/pexels-photo-1603650.jpeg'),
('Cyberpunk Future', 'Neon-lit futuristic cityscape with sci-fi aesthetic', 'fantasy', 15, 6, 'https://images.pexels.com/photos/2246476/pexels-photo-2246476.jpeg'),
('Oil Painting Classic', 'Renaissance-style oil painting with rich textures', 'artistic', 12, 7, 'https://images.pexels.com/photos/1579708/pexels-photo-1579708.jpeg'),
('Watercolor Dream', 'Soft watercolor aesthetic with pastel colors', 'artistic', 12, 8, 'https://images.pexels.com/photos/1616470/pexels-photo-1616470.jpeg'),
('Vintage Film', 'Nostalgic film photography look with warm grain', 'artistic', 10, 9, 'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg'),
('Royal Palace', 'Grand European palace interior with baroque architecture', 'classic', 12, 10, 'https://images.pexels.com/photos/2403251/pexels-photo-2403251.jpeg')
ON CONFLICT DO NOTHING;
