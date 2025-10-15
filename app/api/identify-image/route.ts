import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ModelConfig } from '@/types/model-config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 从环境变量读取配置（作为回退）
const ENV_IDENTIFY_API_BASE_URL = process.env.IDENTIFY_API_BASE_URL || 'https://api.openai.com';
const ENV_IDENTIFY_API_KEY = process.env.IDENTIFY_API_KEY;
const ENV_IDENTIFY_MODEL = process.env.IDENTIFY_MODEL || 'gpt-4o-mini';

/**
 * 从数据库获取激活的识别模型配置
 */
async function getActiveIdentifyConfig(supabase: unknown): Promise<ModelConfig | null> {
  try {
    const client = supabase as ReturnType<typeof createClient>;
    const { data, error } = await client
      .from('model_configs')
      .select('*')
      .eq('type', 'identify-image')
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('查询激活识别配置失败:', error);
      return null;
    }

    return data as ModelConfig;
  } catch (err) {
    console.error('获取激活识别配置异常:', err);
    return null;
  }
}

/**
 * 使用 OpenAI 兼容 API 识别图片是否包含人
 */
async function identifyPerson(
  imageUrl: string,
  apiBaseUrl: string,
  apiKey: string,
  model: string
): Promise<{ hasPerson: boolean; confidence: number; description: string }> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/v1/chat/completions`;

  const requestData = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '请判断这张图片中是否包含人物。只需回答 YES 或 NO，并简要说明理由（不超过20字）。格式：YES/NO - 理由',
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ],
    max_tokens: 100,
    temperature: 0.1,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`识别 API 请求失败: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || '';

  // 解析响应
  const hasPerson = content.toUpperCase().includes('YES');
  const confidence = hasPerson ? 0.9 : 0.1;

  return {
    hasPerson,
    confidence,
    description: content.trim(),
  };
}

/**
 * POST /api/identify-image
 * 识别图片中是否包含人物
 */
export async function POST(req: NextRequest) {
  const requestId = `identify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] ========== 开始处理图片识别请求 ==========`);

  try {
    // 1) 认证校验
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error(`[${requestId}] ❌ Supabase 环境变量未配置`);
      return NextResponse.json(
        { error: 'Server misconfigured: Supabase env missing' },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');

    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      console.error(`[${requestId}] ❌ 未提供认证 Token`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      console.error(`[${requestId}] ❌ 用户认证失败:`, userErr);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[${requestId}] ✅ 用户认证成功: ${userData.user.id}`);

    // 2) 获取识别模型配置
    const dbConfig = await getActiveIdentifyConfig(supabase);

    let IDENTIFY_API_BASE_URL: string;
    let IDENTIFY_API_KEY: string;
    let IDENTIFY_MODEL: string;

    if (dbConfig) {
      console.log(`[${requestId}] ✅ 使用数据库配置: ${dbConfig.name} (ID: ${dbConfig.id})`);
      IDENTIFY_API_BASE_URL = dbConfig.api_base_url;
      IDENTIFY_API_KEY = dbConfig.api_key;
      IDENTIFY_MODEL = dbConfig.model_name;
    } else {
      console.log(`[${requestId}] ⚠️ 未找到激活的数据库配置，使用环境变量回退`);
      IDENTIFY_API_BASE_URL = ENV_IDENTIFY_API_BASE_URL;
      IDENTIFY_API_KEY = ENV_IDENTIFY_API_KEY || '';
      IDENTIFY_MODEL = ENV_IDENTIFY_MODEL;
    }

    if (!IDENTIFY_API_KEY) {
      console.error(`[${requestId}] ❌ IDENTIFY_API_KEY 未配置`);
      return NextResponse.json(
        { error: 'Server misconfigured: IDENTIFY_API_KEY is missing' },
        { status: 500 }
      );
    }

    // 3) 解析请求体
    const body = await req.json();
    const { images } = body as { images: string[] };

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: '缺少图片参数' }, { status: 400 });
    }

    console.log(`[${requestId}] 开始识别 ${images.length} 张图片`);

    // 4) 识别每张图片
    const results = await Promise.all(
      images.map(async (imageUrl, index) => {
        try {
          console.log(`[${requestId}] 识别图片 ${index + 1}/${images.length}`);
          const result = await identifyPerson(
            imageUrl,
            IDENTIFY_API_BASE_URL,
            IDENTIFY_API_KEY,
            IDENTIFY_MODEL
          );
          console.log(`[${requestId}] 图片 ${index + 1} 识别结果:`, result);
          return {
            index,
            success: true,
            ...result,
          };
        } catch (err) {
          console.error(`[${requestId}] 图片 ${index + 1} 识别失败:`, err);
          return {
            index,
            success: false,
            hasPerson: false,
            confidence: 0,
            description: err instanceof Error ? err.message : '识别失败',
          };
        }
      })
    );

    // 5) 统计结果
    const validImages = results.filter((r) => r.success && r.hasPerson);
    const invalidImages = results.filter((r) => !r.success || !r.hasPerson);

    console.log(`[${requestId}] ✅ 识别完成: ${validImages.length}/${images.length} 张包含人物`);

    return NextResponse.json({
      success: true,
      total: images.length,
      validCount: validImages.length,
      invalidCount: invalidImages.length,
      results,
      allValid: invalidImages.length === 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error(`[${requestId}] ❌ 发生异常:`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

