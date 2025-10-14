import { NextRequest, NextResponse } from 'next/server';
// 该路由使用了 request.nextUrl.searchParams，强制动态渲染以避免构建期静态分析报错
export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import type { GalleryItem } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 获取已分享到画廊的生成作品，包含相关信息
    // 注意：移除了 status = 'completed' 的限制，允许 processing 状态的记录也显示
    const { data: generations, error } = await supabase
      .from('generations')
      .select(`
        id,
        preview_images,
        created_at,
        project:projects!inner(name),
        template:templates!inner(name),
        user:profiles!inner(full_name)
      `)
      .eq('is_shared_to_gallery', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('获取画廊数据失败:', error);
      return NextResponse.json(
        { error: '获取画廊数据失败' },
        { status: 500 }
      );
    }

    // 转换为画廊项目格式
    type GenerationRow = {
      id: string;
      preview_images: string[] | null;
      created_at: string;
      project?: { name?: string } | null;
      template?: { name?: string } | null;
      user?: { full_name?: string } | null;
    };
    const gens = (generations || []) as unknown as GenerationRow[];
    const galleryItems: GalleryItem[] = gens.map((gen) => ({
      id: gen.id,
      preview_images: gen.preview_images || [],
      project_name: gen.project?.name || '未命名项目',
      template_name: gen.template?.name || '未知模板',
      user_name: gen.user?.full_name || '匿名用户',
      created_at: gen.created_at,
    }));

    // 获取总数用于分页
    const { count, error: countError } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('is_shared_to_gallery', true);

    if (countError) {
      console.error('获取画廊总数失败:', countError);
    }

    return NextResponse.json({
      items: galleryItems,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('画廊 API 错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
