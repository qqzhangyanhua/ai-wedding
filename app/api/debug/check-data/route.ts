import { NextRequest, NextResponse } from 'next/server';
// 该路由读取了 request.headers，强制动态渲染
export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';

// 诊断工具：检查用户的项目和生成数据
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '需要认证' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: '认证失败' }, { status: 401 });
    }

    // 查询用户的所有项目
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (projectsError) {
      throw projectsError;
    }

    // 查询用户的所有生成记录
    const { data: generations, error: generationsError } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (generationsError) {
      throw generationsError;
    }

    // 统计信息
    const stats = {
      totalProjects: projects?.length || 0,
      totalGenerations: generations?.length || 0,
      completedGenerations: generations?.filter(g => g.status === 'completed').length || 0,
      sharedToGallery: generations?.filter(g => g.is_shared_to_gallery).length || 0,
      generationsWithImages: generations?.filter(g => 
        Array.isArray(g.preview_images) && g.preview_images.length > 0
      ).length || 0,
    };

    return NextResponse.json({
      userId: user.id,
      stats,
      projects: projects || [],
      generations: generations || [],
    });
  } catch (error) {
    console.error('数据检查失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '检查失败' },
      { status: 500 }
    );
  }
}
