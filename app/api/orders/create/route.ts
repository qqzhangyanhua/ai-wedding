import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'mock'; // 'mock' | 'stripe'
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY; // 可选：接入 Stripe 时使用
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const PLAN_MAP = {
  Starter: { amount: 19.99, credits: 50 },
  Popular: { amount: 49.99, credits: 150 },
  Premium: { amount: 99.99, credits: 400 },
} as const;

type PlanKey = keyof typeof PLAN_MAP;

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
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as { plan: PlanKey };
    const planKey = body?.plan;
    if (!planKey || !(planKey in PLAN_MAP)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    const { amount } = PLAN_MAP[planKey];
    const currency = 'USD';

    // 创建订单（pending）
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: userData.user.id,
        amount,
        currency,
        status: 'pending',
        payment_method: PAYMENT_PROVIDER,
      })
      .select()
      .single();
    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });

    // Provider: Stripe（如已配置）
    if (PAYMENT_PROVIDER === 'stripe') {
      if (!STRIPE_SECRET_KEY) {
        return NextResponse.json({
          error: 'Stripe not configured: STRIPE_SECRET_KEY missing',
        }, { status: 501 });
      }
      try {
        // 动态导入以避免在未安装 stripe 包时报错
        // @ts-expect-error dynamic import without types
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency,
                unit_amount: Math.round(amount * 100),
                product_data: { name: `${planKey} Credits` },
              },
              quantity: 1,
            },
          ],
          success_url: `${SITE_URL}/dashboard?paid=1&oid=${order.id}`,
          cancel_url: `${SITE_URL}/pricing?canceled=1`,
          metadata: { order_id: order.id },
        });

        // 回写（可选）：在订单中记录 checkout session id 以便排查
        await supabase
          .from('orders')
          .update({ payment_intent_id: session.id })
          .eq('id', order.id);

        return NextResponse.json({ orderId: order.id, payment_intent_id: session.id, checkout_url: session.url });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Stripe create session failed';
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    // Provider: mock（默认）
    const payment_intent_id = crypto.randomUUID();
    await supabase
      .from('orders')
      .update({ payment_intent_id })
      .eq('id', order.id);

    // 返回一个占位的“结账链接”，用于前端判断是否需要跳转
    const checkout_url = null; // mock 流程无需跳转
    return NextResponse.json({ orderId: order.id, payment_intent_id, checkout_url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
