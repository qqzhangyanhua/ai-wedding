const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tscqkkkbjkwshiynwpam.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Fra2tiamt3c2hpeW53cGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNjA0OTcsImV4cCI6MjA3NTczNjQ5N30.LdBwPimit3yKD4zjeVY6CNHEt81uH7DMg5CoMfNhOe4'
);

async function checkDetails() {
  const { data } = await supabase
    .from('generations')
    .select('*')
    .eq('is_shared_to_gallery', true)
    .order('created_at', { ascending: false });

  console.log('\n=== 已分享到画廊的 generations 详情 ===\n');

  data?.forEach((gen, i) => {
    console.log(`\n[记录 ${i + 1}]`);
    console.log('ID:', gen.id);
    console.log('Status:', gen.status);
    console.log('Error Message:', gen.error_message || '无');
    console.log('Preview Images:', JSON.stringify(gen.preview_images));
    console.log('Created:', gen.created_at);
    console.log('Completed:', gen.completed_at || '未完成');
    console.log('-'.repeat(60));
  });

  console.log('\n\n=== 分析 ===');
  if (data && data.length > 0) {
    const allProcessing = data.every(g => g.status === 'processing');
    const allEmptyImages = data.every(g => !g.preview_images || g.preview_images.length === 0);

    if (allProcessing && allEmptyImages) {
      console.log('❌ 所有记录都是 processing 状态且没有图片');
      console.log('   可能原因：');
      console.log('   1. 生成流程被中断（前端关闭、网络断开）');
      console.log('   2. AI API 调用失败但没有正确标记为 failed');
      console.log('   3. 生成还在进行中（不太可能，因为创建时间已经过去很久）');
      console.log('\n   建议：');
      console.log('   - 检查浏览器控制台日志，看是否有错误');
      console.log('   - 重新创建一个新项目并生成');
      console.log('   - 或者手动将这些记录标记为 failed');
    }
  }
}

checkDetails();
