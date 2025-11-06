import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth-admin';
import type { SystemAnnouncement } from '@/types/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/admin/announcements
 * 获取所有系统公告（包括未激活的）
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
    .from('system_announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ announcements: data });
}

/**
 * POST /api/admin/announcements
 * 创建新的系统公告
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);

  if (authResult instanceof Response) {
    return authResult;
  }

  const body = await req.json();

  // 验证必填字段
  if (!body.content || typeof body.content !== 'string') {
    return NextResponse.json(
      { error: '公告内容不能为空' },
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
    .from('system_announcements')
    .insert([
      {
        content: body.content.trim(),
        is_active: body.is_active !== undefined ? body.is_active : false,
        published_at: body.published_at || new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ announcement: data }, { status: 201 });
}

/**
 * PUT /api/admin/announcements
 * 更新系统公告
 */
export async function PUT(req: NextRequest) {
  const authResult = await requireAdmin(req);

  if (authResult instanceof Response) {
    return authResult;
  }

  const body = await req.json();

  // 验证必填字段
  if (!body.id) {
    return NextResponse.json(
      { error: '缺少公告 ID' },
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

  const updateData: Partial<SystemAnnouncement> = {};

  if (body.content !== undefined) {
    updateData.content = body.content.trim();
  }
  if (body.is_active !== undefined) {
    updateData.is_active = body.is_active;
  }
  if (body.published_at !== undefined) {
    updateData.published_at = body.published_at;
  }

  const { data, error } = await supabase
    .from('system_announcements')
    .update(updateData)
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ announcement: data });
}

/**
 * DELETE /api/admin/announcements
 * 删除系统公告
 */
export async function DELETE(req: NextRequest) {
  const authResult = await requireAdmin(req);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: '缺少公告 ID' },
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

  const { error } = await supabase
    .from('system_announcements')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}





