import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ModelConfigSource } from '@/types/model-config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface AvailableSourcesResponse {
  sources: ModelConfigSource[];
}

/**
 * GET /api/model-sources/available
 * 获取所有已配置且激活的模型来源
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    },
  });

  // 验证用户身份（可选，根据需求决定是否需要认证）
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 查询所有激活的图片生成配置
    const { data, error } = await supabase
      .from('model_configs')
      .select('source')
      .eq('type', 'generate-image')
      .eq('status', 'active');

    if (error) {
      console.error('查询可用模型来源失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 提取唯一的 source 值
    const uniqueSources = Array.from(
      new Set(data?.map((config) => config.source as ModelConfigSource) || [])
    );

    return NextResponse.json({ sources: uniqueSources });
  } catch (error) {
    console.error('获取可用模型来源出错:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
