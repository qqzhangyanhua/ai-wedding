import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth-admin';
import type { UpdateModelConfigInput, ModelConfig } from '@/types/model-config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 脱敏 API Key
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
 * GET /api/admin/model-configs/[id]
 * 获取单个模型配置详情（管理员）
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(req);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id } = params;

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
    .eq('id', id)
    .single();

  if (error) {
    console.error('获取模型配置失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: '配置不存在' }, { status: 404 });
  }

  // 返回完整的 API Key（管理员需要编辑）
  return NextResponse.json({ data });
}

/**
 * PATCH /api/admin/model-configs/[id]
 * 更新模型配置（管理员）
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(req);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id } = params;
  const body = (await req.json()) as UpdateModelConfigInput;

  // 构建更新对象（只更新提供的字段）
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.api_base_url !== undefined) updateData.api_base_url = body.api_base_url;
  if (body.api_key !== undefined) updateData.api_key = body.api_key;
  if (body.model_name !== undefined) updateData.model_name = body.model_name;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.description !== undefined) updateData.description = body.description;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: '没有提供要更新的字段' }, { status: 400 });
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
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新模型配置失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: '配置不存在' }, { status: 404 });
  }

  // 返回时脱敏 API Key
  const result = {
    ...data,
    api_key_masked: maskApiKey((data as ModelConfig).api_key),
    api_key: undefined,
  };

  return NextResponse.json({ data: result });
}

/**
 * DELETE /api/admin/model-configs/[id]
 * 删除模型配置（管理员）
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(req);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { id } = params;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: req.headers.get('authorization') || '',
      },
    },
  });

  const { error } = await supabase.from('model_configs').delete().eq('id', id);

  if (error) {
    console.error('删除模型配置失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

