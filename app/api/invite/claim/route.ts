import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 仅服务端使用 Service Role（绕过 RLS）
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500 });
    }

    const { invitee_id, ref_code } = await req.json();
    if (!invitee_id || !ref_code) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 查询邀请人
    const { data: inviter, error: invErr } = await admin
      .from('profiles')
      .select('*')
      .eq('invite_code', ref_code)
      .maybeSingle();
    if (invErr || !inviter) {
      return new Response(JSON.stringify({ error: 'Invalid referrer code' }), { status: 400 });
    }

    // 奖励配置
    const INVITER_REWARD = 30;
    const INVITEE_REWARD = 20;

    // 事务式更新（最佳用 RPC，简化为顺序更新 + 近似幂等）
    // 标记：若 invitee 已经设置过 invited_by，则跳过
    const { data: invitee } = await admin
      .from('profiles')
      .select('invited_by')
      .eq('id', invitee_id)
      .maybeSingle();
    if (invitee?.invited_by) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
    }

    const updates = [
      admin
        .from('profiles')
        .update({
          credits: (inviter.credits || 0) + INVITER_REWARD,
          invite_count: (inviter.invite_count || 0) + 1,
          reward_credits: (inviter.reward_credits || 0) + INVITER_REWARD,
        })
        .eq('id', inviter.id),
      admin
        .from('profiles')
        .update({
          credits: (0 + INVITEE_REWARD) + 50, // 新用户基础 50 + 奖励
          invited_by: ref_code,
        })
        .eq('id', invitee_id),
      admin
        .from('invite_events')
        .insert({
          inviter_id: inviter.id,
          invitee_id,
          inviter_code: ref_code,
          reward_credits: INVITER_REWARD,
        }),
    ];

    const res = await Promise.allSettled(updates);
    const hasError = res.some((r) => r.status === 'rejected');
    if (hasError) {
      return new Response(JSON.stringify({ error: 'Update failed' }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
