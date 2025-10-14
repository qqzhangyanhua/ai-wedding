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

/**
 * 将用户输入的提示词包裹为标准模板，以匹配成功案例格式。
 * - 若用户已包含关键锚点（如 STRICT REQUIREMENTS / SPECIFIC EDITING REQUEST），则不重复包裹。
 * - 固定英文模板，保障上游模型对"人脸保持"等要求的严格遵循。
 * - 参考demo处理方式，保持提示词完整性，不进行截断。
 */
function composePrompt(userPrompt: string): string {
  const p = (userPrompt || '').trim();
  // 若已包含模板关键字，则原样返回，避免重复注入
  const hasTemplate = /STRICT REQUIREMENTS|Please edit the provided original image|SPECIFIC EDITING REQUEST/i.test(p);
  if (hasTemplate) return p;

  const FACE_PRESERVATION =
    'STRICT REQUIREMENTS:\n' +
    '1. ABSOLUTELY preserve all facial features, facial contours, eye shape, nose shape, mouth shape, and all key characteristics from the original image\n' +
    "2. Maintain the person's basic facial structure and proportions COMPLETELY unchanged\n" +
    '3. Ensure the person in the edited image is 100% recognizable as the same individual\n' +
    '4. NO changes to any facial details including skin texture, moles, scars, or other distinctive features\n' +
    '5. If style conversion is involved, MUST maintain facial realism and accuracy\n' +
    '6. Focus ONLY on non-facial modifications as requested';

  const INTRO = 'Please edit the provided original image based on the following guidelines:';
  const CLOSING = "Please focus your modifications ONLY on the user's specific requirements while strictly following the face preservation guidelines above. Generate a high-quality edited image that maintains facial identity.";

  // 参考demo方式：保持用户输入完整性，不进行长度截断
  return `${INTRO}\n\n${FACE_PRESERVATION}\n\nSPECIFIC EDITING REQUEST: ${p}\n\n${CLOSING}`;
}

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

    // 使用模板化提示词，确保满足成功案例的提示词格式
    const composedPrompt = composePrompt(prompt);
    const chatContent: ChatContentItem[] = [{ type: 'text', text: composedPrompt }];

    // 添加图片输入（最多3张）：支持 dataURL 与 http(s) URL
    if (Array.isArray(image_inputs)) {
      const picked = image_inputs
        .filter((s) =>
          typeof s === 'string' &&
          (s.startsWith('data:image/') || s.startsWith('http://') || s.startsWith('https://'))
        )
        .slice(0, 3);
      console.log(`[${requestId}] 图片输入: ${picked.length} 张`);
      for (const url of picked) {
        let preview = '';
        if (url.startsWith('data:image/')) {
          preview = url.substring(0, 50) + '...' + url.substring(url.length - 20);
        } else {
          preview = url.substring(0, 100) + (url.length > 100 ? '...' : '');
        }
        console.log(`[${requestId}]   - 图片: ${preview}`);
        chatContent.push({ type: 'image_url', image_url: { url } });
      }
    } else {
      console.log(`[${requestId}] 无图片输入`);
    }

    // 【重要】参考 demo 优化参数 - 使用保守的 temperature 和 top_p 以提高人脸保持准确度
    const requestData = {
      model: model || IMAGE_CHAT_MODEL,
      temperature: 0.2, // 保守模式：降低随机性，提高稳定性和人脸保持准确度（demo 推荐值）
      top_p: 0.7,       // 保守模式：限制采样范围，避免生成过于发散的结果（demo 推荐值）
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

   

    // 打印完整的 prompt 文本（用于对比）
    const textContent = requestData.messages[0].content.find(
      (item): item is { type: 'text'; text: string } => item.type === 'text'
    );
    if (textContent) {
      console.log(`[${requestId}] ---------- 完整 Prompt Text ----------`);
      console.log(textContent.text);
      console.log(`[${requestId}] ---------- Prompt 长度: ${textContent.text.length} 字符 ----------`);
    }

    // 打印 content 结构（隐藏 base64 详情）
    console.log(`[${requestId}] ---------- Content 结构 ----------`);
    requestData.messages[0].content.forEach((item, idx) => {
      if (item.type === 'text') {
        console.log(`[${requestId}]   [${idx}] type: "text", length: ${item.text.length} 字符`);
      } else if (item.type === 'image_url') {
        const urlPreview = item.image_url.url.substring(0, 50) + '...[base64 data]';
        console.log(`[${requestId}]   [${idx}] type: "image_url", url: ${urlPreview}`);
      }
    });

  

    console.log(`[${JSON.stringify(requestData)}] ========== 开始发送请求入参 ==========`);
    // ==================== 日志结束 ====================

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
