const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tscqkkkbjkwshiynwpam.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Fra2tiamt3c2hpeW53cGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNjA0OTcsImV4cCI6MjA3NTczNjQ5N30.LdBwPimit3yKD4zjeVY6CNHEt81uH7DMg5CoMfNhOe4'
);

async function checkData() {
  console.log('='.repeat(60));

  // 查看所有 generations 的状态分布
  const { data: all } = await supabase.from('generations').select('status, is_shared_to_gallery');

  console.log('\n所有 generations 的状态分布:');
  const stats = {};
  all?.forEach(g => {
    const key = `status=${g.status}, shared=${g.is_shared_to_gallery}`;
    stats[key] = (stats[key] || 0) + 1;
  });
  console.table(stats);

  // 查询符合画廊条件的数据
  const { data: gallery, count } = await supabase
    .from('generations')
    .select('*', { count: 'exact' })
    .eq('is_shared_to_gallery', true)
    .eq('status', 'completed');

  console.log(`\n符合画廊条件的数据 (shared=true AND status=completed): ${count} 条`);

  if (gallery && gallery.length > 0) {
    console.log('\n样例数据:');
    console.log(gallery[0]);
  } else {
    console.log('\n❌ 没有符合条件的数据！');
    console.log('\n建议：');
    console.log('1. 在 Supabase SQL Editor 中执行:');
    console.log('   UPDATE generations SET status = \'completed\' WHERE is_shared_to_gallery = true;');
    console.log('2. 或者修改一些 generation 记录，将 status 改为 \'completed\'');
  }

  console.log('\n' + '='.repeat(60));
}

checkData();
