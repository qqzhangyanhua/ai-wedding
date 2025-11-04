-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT favorites_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id)
);
CREATE TABLE public.generations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  template_id uuid,
  status text DEFAULT 'pending'::text,
  preview_images jsonb DEFAULT '[]'::jsonb,
  high_res_images jsonb DEFAULT '[]'::jsonb,
  error_message text,
  credits_used integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  is_shared_to_gallery boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT generations_pkey PRIMARY KEY (id),
  CONSTRAINT generations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT generations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT generations_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id)
);
CREATE TABLE public.image_downloads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  generation_id uuid NOT NULL,
  image_index integer NOT NULL,
  image_type text NOT NULL DEFAULT 'preview'::text,
  order_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT image_downloads_pkey PRIMARY KEY (id),
  CONSTRAINT image_downloads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT image_downloads_generation_id_fkey FOREIGN KEY (generation_id) REFERENCES public.generations(id),
  CONSTRAINT image_downloads_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.image_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  generation_id uuid NOT NULL,
  image_index integer NOT NULL,
  image_type text NOT NULL DEFAULT 'preview'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT image_likes_pkey PRIMARY KEY (id),
  CONSTRAINT image_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT image_likes_generation_id_fkey FOREIGN KEY (generation_id) REFERENCES public.generations(id)
);
CREATE TABLE public.invite_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inviter_id uuid,
  invitee_id uuid,
  inviter_code text,
  reward_credits integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invite_events_pkey PRIMARY KEY (id),
  CONSTRAINT invite_events_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.profiles(id),
  CONSTRAINT invite_events_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.model_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type = ANY (ARRAY['generate-image'::text, 'identify-image'::text, 'other'::text])),
  name text NOT NULL,
  api_base_url text NOT NULL,
  api_key text NOT NULL,
  model_name text NOT NULL,
  status text NOT NULL DEFAULT 'inactive'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT model_configs_pkey PRIMARY KEY (id),
  CONSTRAINT model_configs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  generation_id uuid,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD'::text,
  status text DEFAULT 'pending'::text,
  payment_method text,
  payment_intent_id text,
  purchased_images jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT orders_generation_id_fkey FOREIGN KEY (generation_id) REFERENCES public.generations(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  avatar_url text,
  credits integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  invite_code text,
  invited_by text,
  invite_count integer DEFAULT 0,
  reward_credits integer DEFAULT 0,
  role text DEFAULT 'user'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'draft'::text,
  uploaded_photos jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  preview_image_url text,
  prompt_config jsonb DEFAULT '{}'::jsonb,
  price_credits integer DEFAULT 10,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  prompt_list jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT templates_pkey PRIMARY KEY (id)
);