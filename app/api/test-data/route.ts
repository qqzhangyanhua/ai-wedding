import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 仅在开发环境使用的测试数据接口
export async function POST(request: NextRequest) {
  // 只在开发环境允许
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: '仅在开发环境可用' }, { status: 403 });
  }

  try {
    const { action, userId } = await request.json();

    if (action === 'create_test_project') {
      if (!userId) {
        return NextResponse.json({ error: '需要用户ID' }, { status: 400 });
      }

      // 创建测试项目
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: '测试婚纱照项目',
          status: 'completed',
          uploaded_photos: [
            'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=400'
          ],
        })
        .select()
        .single();

      if (projectError || !project) {
        throw new Error('创建测试项目失败');
      }

      // 获取一个模板ID
      const { data: template } = await supabase
        .from('templates')
        .select('id')
        .limit(1)
        .single();

      if (!template) {
        throw new Error('没有可用的模板');
      }

      // 创建测试生成记录
      const testImages = [
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
      ];

      const { data: generation, error: generationError } = await supabase
        .from('generations')
        .insert({
          project_id: project.id,
          user_id: userId,
          template_id: template.id,
          status: 'completed',
          preview_images: testImages,
          high_res_images: testImages,
          is_shared_to_gallery: false,
          credits_used: 10,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (generationError) {
        throw new Error('创建测试生成记录失败');
      }

      return NextResponse.json({
        success: true,
        message: '测试数据创建成功',
        project: project,
        generation: generation,
      });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('测试数据创建失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}
