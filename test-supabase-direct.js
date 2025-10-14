// 直接测试 Supabase 连接（不依赖 Next.js）
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tscqkkkbjkwshiynwpam.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Fra2tiamt3c2hpeW53cGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNjA0OTcsImV4cCI6MjA3NTczNjQ5N30.LdBwPimit3yKD4zjeVY6CNHEt81uH7DMg5CoMfNhOe4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('='.repeat(60));
  console.log('测试 Supabase 连接');
  console.log('URL:', supabaseUrl);
  console.log('='.repeat(60));

  // 测试 1: 查询所有 generations
  console.log('\n[测试 1] 查询所有 generations...');
  const { data: all, error: err1, count: count1 } = await supabase
    .from('generations')
    .select('*', { count: 'exact' });

  console.log('结果:', {
    count: count1,
    error: err1?.message,
    hasData: !!all && all.length > 0
  });

  if (all && all.length > 0) {
    console.log('第一条数据:', all[0]);
  }

  // 测试 2: 查询已分享的
  console.log('\n[测试 2] 查询 is_shared_to_gallery = true...');
  const { data: shared, error: err2, count: count2 } = await supabase
    .from('generations')
    .select('*', { count: 'exact' })
    .eq('is_shared_to_gallery', true);

  console.log('结果:', {
    count: count2,
    error: err2?.message,
    hasData: !!shared && shared.length > 0
  });

  // 测试 3: 查询 templates（应该有数据）
  console.log('\n[测试 3] 查询 templates...');
  const { data: templates, error: err3, count: count3 } = await supabase
    .from('templates')
    .select('*', { count: 'exact' });

  console.log('结果:', {
    count: count3,
    error: err3?.message,
    hasData: !!templates && templates.length > 0
  });

  console.log('\n' + '='.repeat(60));
  console.log('测试完成');
  console.log('='.repeat(60));
}

test().catch(console.error);
