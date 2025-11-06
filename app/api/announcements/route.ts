import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * GET /api/announcements
 * 获取当前激活的系统公告（单条）
 * 此接口无需身份验证，所有用户均可访问
 */
export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase
    .from('system_announcements')
    .select('*')
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 如果没有激活的公告，返回 null
  return NextResponse.json({ announcement: data || null });
}





