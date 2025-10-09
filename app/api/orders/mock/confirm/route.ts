import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const CREDITS_BY_AMOUNT: Record<string, number> = {
  '19.99': 50,
  '49.99': 150,
  '99.99': 400,
};

export async function POST(req: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Server misconfigured: Supabase env missing' }, { status: 500 });
    }

    // 简化版“模拟回调”：要求携带用户会话，确保只能确认自己的订单
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as { payment_intent_id?: string };
    const pid = body?.payment_intent_id;
    if (!pid) return NextResponse.json({ error: 'Missing payment_intent_id' }, { status: 400 });

    // 1) 读取订单并校验归属
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_intent_id', pid)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.user_id !== userData.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (order.status === 'completed') {
      return NextResponse.json({ ok: true, message: 'Already completed' }, { status: 200 });
    }

    // 2) 标记订单完成
    const { error: updErr } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', order.id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // 3) 按金额映射增加积分
    const creditsToAdd = CREDITS_BY_AMOUNT[String(order.amount)] || 0;
    if (creditsToAdd > 0) {
      // 读取当前积分
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', order.user_id)
        .maybeSingle();
      if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

      const newCredits = (profile?.credits || 0) + creditsToAdd;
      const { error: credErr } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', order.user_id);
      if (credErr) return NextResponse.json({ error: credErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, creditsAdded: creditsToAdd });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

