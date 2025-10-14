import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth-admin';
import type { CreateTemplatePayload } from '@/types/admin';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/admin/templates
 * Fetch all templates (including inactive ones) for admin management
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);

  if (authResult instanceof Response) {
    return authResult;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: req.headers.get('authorization') || '',
      },
    },
  });

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data });
}

/**
 * POST /api/admin/templates
 * Create a new template
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);

  if (authResult instanceof Response) {
    return authResult;
  }

  const body = await req.json() as CreateTemplatePayload;

  // Validate required fields
  if (!body.name || !body.category || !body.preview_image_url) {
    return NextResponse.json(
      { error: 'Missing required fields: name, category, preview_image_url' },
      { status: 400 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: req.headers.get('authorization') || '',
      },
    },
  });

  const { data, error } = await supabase
    .from('templates')
    .insert([
      {
        name: body.name,
        description: body.description || '',
        category: body.category,
        preview_image_url: body.preview_image_url,
        prompt_config: body.prompt_config || {},
        price_credits: body.price_credits || 10,
        is_active: body.is_active !== undefined ? body.is_active : true,
        sort_order: body.sort_order || 0,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data }, { status: 201 });
}
