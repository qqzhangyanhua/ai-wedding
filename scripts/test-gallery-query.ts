/**
 * 调试脚本：直接测试画廊查询
 * 用于诊断为什么 API 返回空数据
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 加载 .env 文件
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 环境变量缺失');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testGalleryQuery() {
  console.log('='.repeat(60));
  console.log('🔍 开始测试画廊查询');
  console.log('='.repeat(60));

  // 测试 1: 查询所有 generations
  console.log('\n📊 测试 1: 查询所有 generations');
  const { data: allGens, error: allError, count: allCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact' });

  console.log(`   总数: ${allCount}`);
  if (allError) console.error('   错误:', allError);

  // 测试 2: 查询 is_shared_to_gallery = true 的记录
  console.log('\n📊 测试 2: 查询已分享的 generations');
  const { data: sharedGens, error: sharedError, count: sharedCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact' })
    .eq('is_shared_to_gallery', true);

  console.log(`   已分享数: ${sharedCount}`);
  if (sharedError) console.error('   错误:', sharedError);
  if (sharedGens && sharedGens.length > 0) {
    console.log('   样例数据:', JSON.stringify(sharedGens[0], null, 2));
  }

  // 测试 3: 查询 status = 'completed' 的记录
  console.log('\n📊 测试 3: 查询已完成的 generations');
  const { data: completedGens, error: completedError, count: completedCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact' })
    .eq('status', 'completed');

  console.log(`   已完成数: ${completedCount}`);
  if (completedError) console.error('   错误:', completedError);

  // 测试 4: 组合条件查询
  console.log('\n📊 测试 4: 组合条件查询（已分享 + 已完成）');
  const { data: combinedGens, error: combinedError, count: combinedCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact' })
    .eq('is_shared_to_gallery', true)
    .eq('status', 'completed');

  console.log(`   符合条件数: ${combinedCount}`);
  if (combinedError) console.error('   错误:', combinedError);
  if (combinedGens && combinedGens.length > 0) {
    console.log('   样例数据:', JSON.stringify(combinedGens[0], null, 2));
  }

  // 测试 5: 完整画廊查询（包含关联表）
  console.log('\n📊 测试 5: 完整画廊查询（带关联）');
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
    .order('created_at', { ascending: false })
    .limit(5);

  console.log(`   返回数量: ${galleryData?.length || 0}`);
  if (galleryError) {
    console.error('   ❌ 错误:', galleryError);
  } else if (galleryData && galleryData.length > 0) {
    console.log('   ✅ 成功! 样例数据:');
    console.log(JSON.stringify(galleryData[0], null, 2));
  } else {
    console.log('   ⚠️  查询成功但返回空数组');
  }

  // 测试 6: 不使用 !inner，看看是否是关联问题
  console.log('\n📊 测试 6: 不使用 inner join');
  const { data: noInnerData, error: noInnerError } = await supabase
    .from('generations')
    .select(`
      id,
      preview_images,
      created_at,
      project_id,
      template_id,
      user_id,
      status,
      is_shared_to_gallery
    `)
    .eq('is_shared_to_gallery', true)
    .eq('status', 'completed')
    .limit(5);

  console.log(`   返回数量: ${noInnerData?.length || 0}`);
  if (noInnerError) {
    console.error('   ❌ 错误:', noInnerError);
  } else if (noInnerData && noInnerData.length > 0) {
    console.log('   ✅ 样例数据:');
    console.log(JSON.stringify(noInnerData[0], null, 2));
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 测试完成');
  console.log('='.repeat(60));
}

testGalleryQuery().catch(console.error);
