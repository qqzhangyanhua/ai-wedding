import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ModelConfig } from '@/types/model-config';
import type { PromptItem } from '@/types/prompt';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 从数据库获取激活的提示词生成模型配置
 */
async function getActivePromptsConfig(supabase: unknown): Promise<ModelConfig | null> {
  try {
    const client = supabase as ReturnType<typeof createClient>;
    const { data, error } = await client
      .from('model_configs')
      .select('*')
      .eq('type', 'generate-prompts')
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('查询激活提示词生成配置失败:', error);
      return null;
    }

    return data as ModelConfig;
  } catch (err) {
    console.error('获取激活提示词生成配置异常:', err);
    return null;
  }
}

/**
 * 使用 OpenAI 兼容 API 分析图片并生成提示词
 */
async function generateWeddingPrompts(
  imageBase64: string,
  apiBaseUrl: string,
  apiKey: string,
  model: string
): Promise<PromptItem[]> {
  const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/v1/chat/completions`;

  // 确保 base64 格式正确
  const base64Data = imageBase64.includes('base64,') 
    ? imageBase64 
    : `data:image/jpeg;base64,${imageBase64}`;

  const requestData = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `分析这张婚纱照的风格，生成5个同类型的AI图像生成提示词。

关键要求：
1. 每个提示词都要包含"保持人物五官特征"这个核心要求
2. 中文和英文必须表达完全相同的意思，只是语言不同
3. 描述要包含：场景、服装、姿势、光线、氛围等关键元素
4. 5个提示词要有细微差异（如角度、光线、背景细节等）
5. 必须返回完整的JSON格式

JSON格式示例：
{
  "prompts": [
    {
      "index": 1,
      "chinese": "保持人物五官特征，一对新人在巴黎铁塔前拍摄浪漫婚纱照，新娘穿白色婚纱，新郎穿黑色西装，黄昏时分，柔和光线，电影感构图",
      "english": "Maintain facial features, a couple taking romantic wedding photos in front of the Eiffel Tower in Paris, bride in white wedding dress, groom in black suit, golden hour, soft lighting, cinematic composition"
    }
  ]
}

重要：中文和英文必须表达相同的内容，不要让英文比中文更详细或更简略。请返回完整的5个提示词。`,
          },
          {
            type: 'image_url',
            image_url: {
              url: base64Data,
            },
          },
        ],
      },
    ],
    max_tokens: 4000,
    temperature: 0.7,
    response_format: { type: 'json_object' },
  };

  console.log(`[generateWeddingPrompts] 调用 API: ${endpoint}`);
  console.log(`[generateWeddingPrompts] 模型: ${model}`);
  console.log(`[generateWeddingPrompts] 图片大小: ${imageBase64.substring(0, 50)}...`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestData),
  });

  console.log(`[generateWeddingPrompts] API 响应状态: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[generateWeddingPrompts] API 错误响应:`, errorText.substring(0, 500));
    throw new Error(`提示词生成 API 请求失败: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  const finishReason = result.choices?.[0]?.finish_reason;
  
  console.log(`[generateWeddingPrompts] API 完整响应结构:`, JSON.stringify({
    hasChoices: !!result.choices,
    choicesLength: result.choices?.length,
    hasMessage: !!result.choices?.[0]?.message,
    hasContent: !!result.choices?.[0]?.message?.content,
    contentType: typeof result.choices?.[0]?.message?.content,
    contentLength: result.choices?.[0]?.message?.content?.length,
    finishReason: finishReason
  }));

  // 检查是否因为长度限制而被截断
  if (finishReason === 'length') {
    console.error(`[generateWeddingPrompts] 响应被截断，finish_reason: length`);
    throw new Error('生成的内容过长被截断，请重试');
  }

  const content = result.choices?.[0]?.message?.content || '';
  console.log(`[generateWeddingPrompts] 提取的内容前 300 字符:`, content.substring(0, 300));
  console.log(`[generateWeddingPrompts] 内容总长度:`, content.length);

  // 解析 JSON 响应
  try {
    const parsed = JSON.parse(content);
    console.log(`[generateWeddingPrompts] 解析成功，结构:`, JSON.stringify({
      hasPrompts: !!parsed.prompts,
      promptsIsArray: Array.isArray(parsed.prompts),
      promptsLength: parsed.prompts?.length
    }));
    
    if (!parsed.prompts || !Array.isArray(parsed.prompts)) {
      console.error(`[generateWeddingPrompts] 格式错误，完整内容:`, content);
      throw new Error('返回格式不正确：缺少 prompts 数组');
    }
    
    if (parsed.prompts.length === 0) {
      console.error(`[generateWeddingPrompts] 提示词数组为空`);
      throw new Error('生成的提示词数量为 0');
    }
    
    // 验证每个提示词的结构
    for (const prompt of parsed.prompts) {
      if (!prompt.chinese || !prompt.english || typeof prompt.index !== 'number') {
        console.error(`[generateWeddingPrompts] 提示词结构不完整:`, JSON.stringify(prompt));
        throw new Error('提示词结构不完整，缺少必要字段');
      }
    }
    
    console.log(`[generateWeddingPrompts] ✅ 成功返回 ${parsed.prompts.length} 个提示词`);
    return parsed.prompts as PromptItem[];
  } catch (err) {
    console.error(`[generateWeddingPrompts] ❌ JSON 解析失败`);
    console.error(`[generateWeddingPrompts] 错误:`, err);
    console.error(`[generateWeddingPrompts] 原始内容长度:`, content.length);
    console.error(`[generateWeddingPrompts] 原始内容:`, content);
    
    // 如果是 JSON 解析错误，提供更友好的错误信息
    if (err instanceof SyntaxError) {
      throw new Error(`JSON 格式错误：${err.message}。可能是内容被截断，请重试`);
    }
    
    throw new Error('无法解析生成的提示词，请重试');
  }
}

/**
 * POST /api/generate-prompts
 * 根据图片生成婚纱照提示词
 */
export async function POST(req: NextRequest) {
  const requestId = `prompts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] ========== 开始处理提示词生成请求 ==========`);

  try {
    // 1) 认证校验
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error(`[${requestId}] ❌ Supabase 环境变量未配置`);
      return NextResponse.json(
        { success: false, error: 'Server misconfigured: Supabase env missing' },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');

    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      console.error(`[${requestId}] ❌ 未提供认证 Token`);
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      console.error(`[${requestId}] ❌ 用户认证失败:`, userErr);
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[${requestId}] ✅ 用户认证成功: ${userData.user.id}`);

    // 2) 获取提示词生成模型配置
    const dbConfig = await getActivePromptsConfig(supabase);

    if (!dbConfig) {
      console.error(`[${requestId}] ❌ 未找到激活的提示词生成配置`);
      return NextResponse.json(
        { success: false, error: '暂无可用的提示词生成配置，请联系管理员' },
        { status: 500 }
      );
    }

    console.log(`[${requestId}] ✅ 使用数据库配置: ${dbConfig.name} (ID: ${dbConfig.id})`);

    // 3) 解析请求体
    const body = await req.json();
    const { imageBase64 } = body as { imageBase64: string };

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: '缺少图片参数' },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] 开始生成提示词...`);

    // 4) 生成提示词
    const prompts = await generateWeddingPrompts(
      imageBase64,
      dbConfig.api_base_url,
      dbConfig.api_key,
      dbConfig.model_name
    );

    console.log(`[${requestId}] ✅ 成功生成 ${prompts.length} 个提示词`);

    return NextResponse.json({
      success: true,
      prompts,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error(`[${requestId}] ❌ 发生异常:`, err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

