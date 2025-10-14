import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth-admin';
import type { UpdateTemplatePayload } from '@/types/admin';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * PUT /api/admin/templates/[id]
 * Update an existing template
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  const authResult = await requireAdmin(req);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id } = context.params;
  const body = await req.json() as UpdateTemplatePayload;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: req.headers.get('authorization') || '',
      },
    },
  });

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.preview_image_url !== undefined) updateData.preview_image_url = body.preview_image_url;
  if (body.prompt_config !== undefined) updateData.prompt_config = body.prompt_config;
  if (body.prompt_list !== undefined) updateData.prompt_list = body.prompt_list;
  if (body.price_credits !== undefined) updateData.price_credits = body.price_credits;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;
  if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

  const { data, error } = await supabase
    .from('templates')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({ template: data });
}

/**
 * DELETE /api/admin/templates/[id]
 * Delete a template
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  const authResult = await requireAdmin(req);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id } = context.params;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: req.headers.get('authorization') || '',
      },
    },
  });

  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
