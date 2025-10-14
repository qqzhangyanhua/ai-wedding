import { Template } from '../types/database';
import { Sparkles, Palette, Crown, Globe } from 'lucide-react';

export const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Paris Romance',
    description: 'Classic wedding photos with Eiffel Tower backdrop, romantic sunset lighting, and elegant Parisian architecture',
    category: 'location',
    preview_image_url: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=800',
    prompt_config: { basePrompt: '' },
    price_credits: 10,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Santorini Dreams',
    description: 'White-washed buildings and azure seas of Greece, destination wedding vibes with stunning Mediterranean views',
    category: 'location',
    preview_image_url: 'https://images.pexels.com/photos/161764/santorini-travel-holiday-vacation-161764.jpeg?auto=compress&cs=tinysrgb&w=800',
    prompt_config: { basePrompt: '' },
    price_credits: 10,
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Cherry Blossom Tokyo',
    description: 'Traditional Japanese garden with spring sakura flowers in full bloom, serene and romantic atmosphere',
    category: 'location',
    preview_image_url: 'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&cs=tinysrgb&w=800',
    prompt_config: { basePrompt: '' },
    price_credits: 10,
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Iceland Aurora',
    description: 'Magical northern lights and dramatic volcanic landscapes, once-in-a-lifetime epic scenery',
    category: 'location',
    preview_image_url: 'https://images.pexels.com/photos/1933239/pexels-photo-1933239.jpeg?auto=compress&cs=tinysrgb&w=800',
    prompt_config: { basePrompt: '' },
    price_credits: 15,
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Fairytale Castle',
    description: 'Enchanted castle setting with magical golden hour lighting, perfect for a storybook romance',
    category: 'fantasy',
    preview_image_url: 'https://images.pexels.com/photos/1603650/pexels-photo-1603650.jpeg?auto=compress&cs=tinysrgb&w=800',
    prompt_config: { basePrompt: '' },
    price_credits: 15,
    is_active: true,
    sort_order: 5,
    created_at: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Cyberpunk Future',
    description: 'Neon-lit futuristic cityscape with sci-fi aesthetic, bold and unique visual style',
    category: 'fantasy',
    preview_image_url: 'https://images.pexels.com/photos/2246476/pexels-photo-2246476.jpeg?auto=compress&cs=tinysrgb&w=800',
    prompt_config: { basePrompt: '' },
    price_credits: 15,
    is_active: true,
    sort_order: 6,
    created_at: new Date().toISOString()
  },
  {
    id: '7',
    name: 'Underwater Paradise',
    description: 'Ethereal underwater scene with flowing fabrics and bubbles, dreamy and otherworldly',
    category: 'fantasy',
    preview_image_url: 'https://images.pexels.com/photos/1438072/pexels-photo-1438072.jpeg?auto=compress&cs=tinysrgb&w=800',
    prompt_config: { basePrompt: '' },
    price_credits: 20,
    is_active: true,
    sort_order: 7,
    created_at: new Date().toISOString()
  },
  {
    id: '8',
    name: 'Oil Painting Classic',
    description: 'Renaissance-style oil painting with rich textures and dramatic lighting, timeless artistic appeal',
    category: 'artistic',
    preview_image_url: 'https://images.pexels.com/photos/1579708/pexels-photo-1579708.jpeg?auto=compress&cs=tinysrgb&w=800',
    prompt_config: { basePrompt: '' },
    price_credits: 12,
    is_active: true,
    sort_order: 8,
    created_at: new Date().toISOString()
  },
  {
    id: '9',
    name: 'Watercolor Dream',
    description: 'Soft watercolor aesthetic with pastel colors and dreamy atmosphere, gentle and romantic',
    category: 'artistic',
    preview_image_url: 'https://images.pexels.com/photos/1616470/pexels-photo-1616470.jpeg?auto=compress&cs=tinysrgb&w=800',
    prompt_config: { basePrompt: '' },
    price_credits: 12,
    is_active: true,
    sort_order: 9,
    created_at: new Date().toISOString()
  },
  {
    id: '10',
    name: 'Vintage Film',
    description: 'Nostalgic film photography look with warm grain and faded colors, classic and emotional',
    category: 'artistic',
    preview_image_url: 'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=800',
    prompt_config: { basePrompt: '' },
    price_credits: 10,
    is_active: true,
    sort_order: 10,
    created_at: new Date().toISOString()
  },
  {
    id: '11',
    name: 'Royal Palace',
    description: 'Grand European palace interior with baroque architecture, luxurious and majestic',
    category: 'classic',
    preview_image_url: 'https://images.pexels.com/photos/2403251/pexels-photo-2403251.jpeg?auto=compress&cs=tinysrgb&w=800',
    prompt_config: { basePrompt: '' },
    price_credits: 12,
    is_active: true,
    sort_order: 11,
    created_at: new Date().toISOString()
  },
  {
    id: '12',
    name: 'Traditional Chinese',
    description: 'Red phoenix coronet and traditional hanfu in classical Chinese style, rich cultural heritage',
    category: 'classic',
    preview_image_url: 'https://images.pexels.com/photos/3014856/pexels-photo-3014856.jpeg?auto=compress&cs=tinysrgb&w=800',
    prompt_config: { basePrompt: '' },
    price_credits: 12,
    is_active: true,
    sort_order: 12,
    created_at: new Date().toISOString()
  }
];

export const categoryInfo = {
  location: {
    name: 'Destination Locations',
    description: 'Iconic landmarks and breathtaking destinations',
    icon: Globe
  },
  fantasy: {
    name: 'Fantasy & Creative',
    description: 'Magical and imaginative scenes',
    icon: Sparkles
  },
  artistic: {
    name: 'Artistic Styles',
    description: 'Classic art-inspired aesthetics',
    icon: Palette
  },
  classic: {
    name: 'Classic Elegance',
    description: 'Traditional and timeless settings',
    icon: Crown
  }
};
