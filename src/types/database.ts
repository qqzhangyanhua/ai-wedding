export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'location' | 'fantasy' | 'artistic' | 'classic';
  preview_image_url: string;
  prompt_config: Record<string, unknown>;
  price_credits: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  uploaded_photos: string[];
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  project_id: string;
  user_id: string;
  template_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  preview_images: string[];
  high_res_images: string[];
  error_message?: string;
  credits_used: number;
  created_at: string;
  completed_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  generation_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  payment_intent_id?: string;
  purchased_images: string[];
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  template_id: string;
  created_at: string;
}
