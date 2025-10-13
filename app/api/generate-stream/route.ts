import { createClient } from '@supabase/supabase-js';
import { GenerateImageSchema, validateData } from '@/lib/validations';

// 使用 Edge Runtime 以支持流式响应
export const runtime = 'edge';

// 从环境变量读取配置
const IMAGE_API_BASE_URL = process.env.IMAGE_API_BASE_URL || 'https://api.aioec.tech';
const IMAGE_API_KEY = process.env.IMAGE_API_KEY;
const IMAGE_CHAT_MODEL = process.env.IMAGE_CHAT_MODEL || 'gemini-2.5-flash-image';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 简单用户级限流
const RL_WINDOW_MS = 60 * 1000; // 1分钟
const RL_LIMIT = 5; // 每分钟 5 次
type RLRecord = { windowStart: number; count: number };
const rateBucket = new Map<string, RLRecord>();

export async function POST(req: Request) {
  const requestId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] ========== 开始处理流式图片生成请求 ==========`);
  
  try {
    // 日志：环境变量检查
    console.log(`[${requestId}] 环境变量检查:`, {
      IMAGE_API_BASE_URL,
      IMAGE_API_KEY: IMAGE_API_KEY ? `${IMAGE_API_KEY.substring(0, 10)}...` : 'missing',
      IMAGE_CHAT_MODEL,
      SUPABASE_URL,
    });

    if (!IMAGE_API_KEY) {
      console.error(`[${requestId}] ❌ IMAGE_API_KEY 未配置`);
      return new Response(
        JSON.stringify({ error: 'Server misconfigured: IMAGE_API_KEY is missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1) 认证校验
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error(`[${requestId}] ❌ Supabase 环境变量未配置`);
      return new Response(
        JSON.stringify({ error: 'Server misconfigured: Supabase env missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    console.log(`[${requestId}] 认证 Header:`, authHeader ? `Bearer ${authHeader.split(' ')[1]?.substring(0, 20)}...` : 'missing');
    
    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      console.error(`[${requestId}] ❌ 未提供认证 Token`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.split(' ')[1];

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      console.error(`[${requestId}] ❌ 用户认证失败:`, userErr);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[${requestId}] ✅ 用户认证成功: ${userData.user.id}`);

    // 2) 速率限制
    const userId = userData.user.id;
    const now = Date.now();
    const rec = rateBucket.get(userId);
    if (!rec || now - rec.windowStart >= RL_WINDOW_MS) {
      rateBucket.set(userId, { windowStart: now, count: 1 });
    } else {
      if (rec.count >= RL_LIMIT) {
        console.warn(`[${requestId}] ⚠️ 速率限制: 用户 ${userId} 超过限制`);
        return new Response(
          JSON.stringify({ error: 'Too Many Requests' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil((rec.windowStart + RL_WINDOW_MS - now) / 1000)),
            },
          }
        );
      }
      rec.count += 1;
      rateBucket.set(userId, rec);
    }
    console.log(`[${requestId}] 速率限制检查通过: ${rec?.count || 1}/${RL_LIMIT}`);

    const body = await req.json();
    console.log(`[${requestId}] 请求 Body:`, JSON.stringify(body, null, 2));

    // 使用Zod验证输入
    const validation = validateData(GenerateImageSchema, body);
    if (!validation.success) {
      console.error(`[${requestId}] ❌ 参数验证失败:`, validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { prompt, image_inputs, model } = validation.data;
    console.log(`[${requestId}] ✅ 参数验证通过:`, {
      prompt: prompt.substring(0, 100) + '...',
      model: model || IMAGE_CHAT_MODEL,
      image_inputs_count: image_inputs?.length || 0,
    });

    // 构建请求内容
    type ChatContentItem =
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } };

    const chatContent: ChatContentItem[] = [{ type: 'text', text: prompt.trim() }];

    // 添加图片输入（最多3张）
    if (Array.isArray(image_inputs)) {
      const picked = image_inputs
        .filter((s) => typeof s === 'string' && s.startsWith('data:image/'))
        .slice(0, 3);
      console.log(`[${requestId}] 图片输入: ${picked.length} 张`);
      for (const dataUrl of picked) {
        const preview = dataUrl.substring(0, 50) + '...' + dataUrl.substring(dataUrl.length - 20);
        console.log(`[${requestId}]   - 图片: ${preview}`);
        chatContent.push({ type: 'image_url', image_url: { url: dataUrl } });
      }
    } else {
      console.log(`[${requestId}] 无图片输入`);
    }

    // 【重要】完全参考 demo 的请求格式
    const requestData = {
      model: model || IMAGE_CHAT_MODEL,
      temperature: 1,
      top_p: 1,
      messages: [
        {
          role: 'user',
          content: chatContent,
        },
      ],
      stream: true,
      stream_options: {
        include_usage: true,
      },
    };

    // 调用上游 API
    const endpoint = `${IMAGE_API_BASE_URL.replace(/\/$/, '')}/v1/chat/completions`;
    console.log(`[${requestId}] API 端点: ${endpoint}`);
    console.log(`[${requestId}] 📤 发送流式请求到上游 API:`, {
      endpoint,
      model: requestData.model,
      temperature: requestData.temperature,
      top_p: requestData.top_p,
      messages_count: requestData.messages.length,
      content_items: requestData.messages[0].content.length,
      stream: requestData.stream,
    });

    const fetchStartTime = Date.now();
    const upstreamResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${IMAGE_API_KEY}`,
      },
      body: JSON.stringify(requestData),
    });
    const fetchDuration = Date.now() - fetchStartTime;

    console.log(`[${requestId}] 📥 收到上游响应: ${upstreamResponse.status} ${upstreamResponse.statusText} (耗时: ${fetchDuration}ms)`);

    if (!upstreamResponse.ok) {
      const errorData = await upstreamResponse.text();
      console.error(`[${requestId}] ❌ 上游 API 返回错误:`, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        error: errorData,
      });
      return new Response(
        JSON.stringify({ error: `API请求失败: ${upstreamResponse.status} ${errorData}` }),
        { status: upstreamResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] ✅ 开始转发流式响应`);
    console.log(`[${requestId}] ========== 流式请求开始传输 ==========`);

    // 直接转发流式响应
    return new Response(upstreamResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(`[${requestId}] ❌ 发生异常:`, {
      message,
      stack,
      error: err,
    });
    console.error(`[${requestId}] ========== 请求处理失败 ==========`);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

