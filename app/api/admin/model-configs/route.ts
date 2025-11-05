import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth-admin';
import type { CreateModelConfigInput, ModelConfig } from '@/types/model-config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 脱敏 API Key
 * 例如：sk-1234567890abcdef -> sk-123...def
 */
function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) {
    return '***';
  }
  const start = apiKey.substring(0, 6);
  const end = apiKey.substring(apiKey.length - 3);
  return `${start}...${end}`;
}

/**
 * GET /api/admin/model-configs
 * 获取所有模型配置（管理员）
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);

  if (authResult instanceof Response) {
    return authResult;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: req.headers.get('authorization') || '',
      },
    },
  });

  const { data, error } = await supabase
    .from('model_configs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取模型配置失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 脱敏 API Key
  const maskedData = (data as ModelConfig[]).map((config) => ({
    ...config,
    api_key_masked: maskApiKey(config.api_key),
    api_key: undefined, // 不返回完整的 API Key
  }));

  return NextResponse.json({ data: maskedData, total: maskedData.length });
}

/**
 * POST /api/admin/model-configs
 * 创建新的模型配置（管理员）
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);

  if (authResult instanceof Response) {
    return authResult;
  }

  const body = (await req.json()) as CreateModelConfigInput;

  // 验证必填字段
  if (!body.name || !body.type || !body.api_base_url || !body.api_key || !body.model_name) {
    return NextResponse.json(
      { error: '缺少必填字段: name, type, api_base_url, api_key, model_name' },
      { status: 400 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: req.headers.get('authorization') || '',
      },
    },
  });

  // 获取当前用户 ID
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('model_configs')
    .insert([
      {
        type: body.type,
        name: body.name,
        api_base_url: body.api_base_url,
        api_key: body.api_key,
        model_name: body.model_name,
        status: body.status || 'inactive',
        source: body.source || 'openAi',
        description: body.description || null,
        created_by: user?.id,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('创建模型配置失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 返回时脱敏 API Key
  const result = {
    ...data,
    api_key_masked: maskApiKey((data as ModelConfig).api_key),
    api_key: undefined,
  };

  return NextResponse.json({ data: result }, { status: 201 });
}

