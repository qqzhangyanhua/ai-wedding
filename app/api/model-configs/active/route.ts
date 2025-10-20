import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ModelConfig, ModelConfigType } from '@/types/model-config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 强制动态渲染，因为需要读取请求头进行认证
export const dynamic = 'force-dynamic';

/**
 * GET /api/model-configs/active?type=generate-image
 * 获取指定类型的激活配置（需要认证）
 */
export async function GET(req: NextRequest) {
  try {
    // 认证校验
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

    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as ModelConfigType;

    if (!type) {
      return NextResponse.json({ error: '缺少 type 参数' }, { status: 400 });
    }

    // 查询激活的配置
    const { data, error } = await supabase
      .from('model_configs')
      .select('*')
      .eq('type', type)
      .eq('status', 'active')
      .single();

    if (error) {
      // 如果没有找到配置，返回 null 而不是错误
      if (error.code === 'PGRST116') {
        return NextResponse.json({ data: null });
      }
      console.error('查询激活配置失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 返回完整配置（包括 API Key，因为 generate-stream 需要使用）
    return NextResponse.json({ data: data as ModelConfig });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('获取激活配置异常:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

