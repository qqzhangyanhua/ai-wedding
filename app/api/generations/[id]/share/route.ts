import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { isShared } = await request.json();

    // 验证用户身份
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: '未提供认证信息' },
        { status: 401 }
      );
    }

    // 从 Supabase 获取用户信息
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: '认证失败' },
        { status: 401 }
      );
    }

    // 验证生成记录是否属于当前用户
    const { data: generation, error: fetchError } = await supabase
      .from('generations')
      .select('user_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !generation) {
      return NextResponse.json(
        { error: '生成记录不存在' },
        { status: 404 }
      );
    }

    if (generation.user_id !== user.id) {
      return NextResponse.json(
        { error: '无权限操作此记录' },
        { status: 403 }
      );
    }

    if (generation.status !== 'completed') {
      return NextResponse.json(
        { error: '只有已完成的生成记录才能分享到画廊' },
        { status: 400 }
      );
    }

    // 更新分享状态
    const { error: updateError } = await supabase
      .from('generations')
      .update({ is_shared_to_gallery: isShared })
      .eq('id', id);

    if (updateError) {
      console.error('更新分享状态失败:', updateError);
      return NextResponse.json(
        { error: '更新分享状态失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isShared ? '已分享到画廊' : '已取消分享',
    });
  } catch (error) {
    console.error('分享状态切换 API 错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
