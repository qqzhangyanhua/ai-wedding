import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const results: Record<string, unknown> = {};

  // 测试 1: 查询所有 generations
  const { data: allGens, error: allError, count: allCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact' });

  results.test1_all = {
    count: allCount,
    error: allError?.message,
    sample: allGens?.[0],
  };

  // 测试 2: 查询已分享的
  const { data: sharedGens, error: sharedError, count: sharedCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact' })
    .eq('is_shared_to_gallery', true);

  results.test2_shared = {
    count: sharedCount,
    error: sharedError?.message,
    sample: sharedGens?.[0],
  };

  // 测试 3: 查询已完成的
  const { error: completedError, count: completedCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact' })
    .eq('status', 'completed');

  results.test3_completed = {
    count: completedCount,
    error: completedError?.message,
  };

  // 测试 4: 组合条件
  const { data: combinedGens, error: combinedError, count: combinedCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact' })
    .eq('is_shared_to_gallery', true)
    .eq('status', 'completed');

  results.test4_combined = {
    count: combinedCount,
    error: combinedError?.message,
    sample: combinedGens?.[0],
  };

  // 测试 5: 完整查询（带关联）
  const { data: galleryData, error: galleryError } = await supabase
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
    .eq('status', 'completed')
    .not('preview_images', 'eq', '[]')
    .limit(5);

  results.test5_full_query = {
    count: galleryData?.length,
    error: galleryError?.message,
    errorDetails: galleryError,
    sample: galleryData?.[0],
  };

  // 测试 6: 不使用 inner join
  const { data: noInnerData, error: noInnerError } = await supabase
    .from('generations')
    .select('*')
    .eq('is_shared_to_gallery', true)
    .eq('status', 'completed')
    .limit(5);

  results.test6_no_inner = {
    count: noInnerData?.length,
    error: noInnerError?.message,
    sample: noInnerData?.[0],
  };

  return NextResponse.json(results, { status: 200 });
}
