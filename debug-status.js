#!/usr/bin/env node

/**
 * 调试工具：检查数据库中的项目和生成状态
 * 使用方法：node debug-status.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 请确保 .env 文件中配置了 SUPABASE_URL 和 SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectStatus() {
  console.log('🔍 检查项目和生成状态...\n');

  try {
    // 获取所有项目
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        created_at,
        updated_at,
        generations (
          id,
          status,
          preview_images,
          completed_at,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (projectError) {
      throw projectError;
    }

    if (!projects || projects.length === 0) {
      console.log('📝 没有找到任何项目');
      return;
    }

    console.log(`📊 找到 ${projects.length} 个项目:\n`);

    projects.forEach((project, index) => {
      console.log(`${index + 1}. 项目: ${project.name}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   项目状态: ${project.status}`);
      console.log(`   创建时间: ${new Date(project.created_at).toLocaleString()}`);
      console.log(`   更新时间: ${new Date(project.updated_at).toLocaleString()}`);
      
      if (project.generations && project.generations.length > 0) {
        project.generations.forEach((gen, genIndex) => {
          console.log(`   生成 ${genIndex + 1}:`);
          console.log(`     ID: ${gen.id}`);
          console.log(`     状态: ${gen.status}`);
          console.log(`     预览图数量: ${gen.preview_images ? gen.preview_images.length : 0}`);
          console.log(`     创建时间: ${new Date(gen.created_at).toLocaleString()}`);
          if (gen.completed_at) {
            console.log(`     完成时间: ${new Date(gen.completed_at).toLocaleString()}`);
          }
        });
      } else {
        console.log('   ⚠️  没有关联的生成记录');
      }
      console.log('');
    });

    // 检查pending状态的生成
    const { data: pendingGenerations, error: pendingError } = await supabase
      .from('generations')
      .select(`
        id,
        status,
        created_at,
        project:projects(name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (pendingError) {
      throw pendingError;
    }

    if (pendingGenerations && pendingGenerations.length > 0) {
      console.log(`⏳ 发现 ${pendingGenerations.length} 个pending状态的生成:`);
      pendingGenerations.forEach((gen, index) => {
        console.log(`${index + 1}. 生成ID: ${gen.id}`);
        console.log(`   项目: ${gen.project?.name || '未知'}`);
        console.log(`   创建时间: ${new Date(gen.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('✅ 没有pending状态的生成');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

// 运行检查
checkProjectStatus().then(() => {
  console.log('🎉 检查完成');
  process.exit(0);
});




