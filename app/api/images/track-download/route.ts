import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Server misconfigured: Supabase env missing' }, { status: 500 });
    }
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json()) as { generation_id: string; index: number; image_type?: 'preview' | 'high_res'; order_id?: string };
    const { generation_id, index, image_type = 'preview', order_id } = body || {};
    if (!generation_id || typeof index !== 'number') {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }

    const { error } = await supabase
      .from('image_downloads')
      .insert({
        user_id: userData.user.id,
        generation_id,
        image_index: index,
        image_type,
        order_id: order_id || null,
      });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

