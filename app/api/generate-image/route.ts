import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GenerateImageSchema, validateData } from '@/lib/validations';

// 可选：如需运行在 Edge 环境，取消注释
export const runtime = 'edge';

// 从环境变量读取配置（服务端安全，不以 NEXT_PUBLIC_ 开头）
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || process.env.OPENAI_MODEL || 'dall-e-3';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 简单用户级限流：每个用户ID在时间窗内最多请求 N 次
const RL_WINDOW_MS = 60 * 1000; // 1分钟
const RL_LIMIT = 5; // 每分钟 5 次
type RLRecord = { windowStart: number; count: number };
// Edge 运行时下的全局内存（同区域生效）
const rateBucket = new Map<string, RLRecord>();

export async function POST(req: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Server misconfigured: OPENAI_API_KEY is missing' },
        { status: 500 }
      );
    }

    // 1) 认证校验：要求前端携带 Supabase 会话 token（Authorization: Bearer <token>）
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

    // 2) 速率限制（按用户维度）
    const userId = userData.user.id;
    const now = Date.now();
    const rec = rateBucket.get(userId);
    if (!rec || now - rec.windowStart >= RL_WINDOW_MS) {
      rateBucket.set(userId, { windowStart: now, count: 1 });
    } else {
      if (rec.count >= RL_LIMIT) {
        return NextResponse.json(
          { error: 'Too Many Requests' },
          { status: 429, headers: { 'Retry-After': String(Math.ceil((rec.windowStart + RL_WINDOW_MS - now) / 1000)) } }
        );
      }
      rec.count += 1;
      rateBucket.set(userId, rec);
    }

    const body = await req.json();

    // 使用Zod验证输入
    const validation = validateData(GenerateImageSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { prompt, n, size, response_format, model } = validation.data;

    const endpoint = `${OPENAI_BASE_URL.replace(/\/$/, '')}/v1/images/generations`;

    const payload = {
      model: model || OPENAI_IMAGE_MODEL,
      prompt: prompt.trim(),
      n,
      size,
      response_format,
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error || data || 'Image generation failed' },
        { status: res.status }
      );
    }

    // 标准 OpenAI 兼容：返回 data 数组，元素含 url 或 b64_json
    return NextResponse.json(
      { data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
