/**
 * 刷新数据库中的图片 URL
 * 
 * 用途：将数据库中过期的预签名 URL 替换为公共 URL
 * 运行：npx tsx scripts/refresh-image-urls.ts
 */

// 加载环境变量
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量\n');
  console.error('请在 .env 文件中设置：');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=你的_supabase_url');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=你的_service_role_密钥\n');
  console.error('获取 Service Role Key：');
  console.error('  1. 登录 Supabase 控制台: https://supabase.com/dashboard');
  console.error('  2. 选择你的项目: tscqkkkbjkwshiynwpam');
  console.error('  3. 进入 Settings > API');
  console.error('  4. 复制 service_role key（⚠️ 请勿泄露此密钥）\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// MinIO 配置
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://123.57.16.107:9000';
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'ai-images';

/**
 * 从预签名 URL 提取对象名称
 */
function extractObjectName(url: string): string | null {
  try {
    // 预签名 URL 格式: http://host:port/bucket/path/to/object.png?X-Amz-...
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // 移除 bucket 名称前缀
    const bucketPrefix = `/${BUCKET_NAME}/`;
    if (pathname.startsWith(bucketPrefix)) {
      return pathname.substring(bucketPrefix.length);
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * 生成公共 URL
 */
function generatePublicUrl(objectName: string): string {
  const endpointUrl = new URL(MINIO_ENDPOINT);
  const protocol = endpointUrl.protocol;
  const host = endpointUrl.host;
  return `${protocol}//${host}/${BUCKET_NAME}/${objectName}`;
}

/**
 * 刷新 generations 表中的图片 URL
 */
async function refreshGenerationImages() {
  console.log('🔄 开始刷新 generations 表中的图片 URL...\n');
  
  try {
    // 获取所有包含图片的记录
    const { data: generations, error } = await supabase
      .from('generations')
      .select('id, preview_images, high_res_images');

    if (error) {
      throw error;
    }

    if (!generations || generations.length === 0) {
      console.log('📭 没有找到需要更新的记录');
      return;
    }

    console.log(`📦 找到 ${generations.length} 条记录\n`);

    let updatedCount = 0;

    for (const gen of generations) {
      let hasChanges = false;
      let updatedPreviewImages = gen.preview_images;
      let updatedHighResImages = gen.high_res_images;

      // 处理预览图片
      if (gen.preview_images && Array.isArray(gen.preview_images) && gen.preview_images.length > 0) {
        const updated = gen.preview_images.map((url: string) => {
          if (typeof url === 'string' && url.includes('X-Amz-Algorithm')) {
            const objectName = extractObjectName(url);
            if (objectName) {
              hasChanges = true;
              const publicUrl = generatePublicUrl(objectName);
              console.log(`  ✓ 预览图: ${objectName}`);
              return publicUrl;
            }
          }
          return url;
        });
        updatedPreviewImages = updated;
      }

      // 处理高清图片
      if (gen.high_res_images && Array.isArray(gen.high_res_images) && gen.high_res_images.length > 0) {
        const updated = gen.high_res_images.map((url: string) => {
          if (typeof url === 'string' && url.includes('X-Amz-Algorithm')) {
            const objectName = extractObjectName(url);
            if (objectName) {
              hasChanges = true;
              const publicUrl = generatePublicUrl(objectName);
              console.log(`  ✓ 高清图: ${objectName}`);
              return publicUrl;
            }
          }
          return url;
        });
        updatedHighResImages = updated;
      }

      if (hasChanges) {
        const { error: updateError } = await supabase
          .from('generations')
          .update({ 
            preview_images: updatedPreviewImages,
            high_res_images: updatedHighResImages 
          })
          .eq('id', gen.id);

        if (updateError) {
          console.error(`  ❌ 更新失败 (ID: ${gen.id}):`, updateError.message);
        } else {
          updatedCount++;
          console.log(`  ✅ 已更新记录 ID: ${gen.id}\n`);
        }
      }
    }

    console.log(`\n✨ 完成！共更新 ${updatedCount} 条记录`);
  } catch (error) {
    console.error('❌ 刷新失败:', error);
    throw error;
  }
}

/**
 * 刷新 templates 表中的图片 URL
 */
async function refreshTemplateImages() {
  console.log('\n🔄 开始刷新 templates 表中的图片 URL...\n');
  
  try {
    const { data: templates, error } = await supabase
      .from('templates')
      .select('id, preview_image_url');

    if (error) {
      throw error;
    }

    if (!templates || templates.length === 0) {
      console.log('📭 没有找到需要更新的模板');
      return;
    }

    console.log(`📦 找到 ${templates.length} 个模板\n`);

    let updatedCount = 0;

    for (const template of templates) {
      let hasChanges = false;
      let updatedPreviewUrl = template.preview_image_url;

      // 检查预览图
      if (template.preview_image_url && 
          typeof template.preview_image_url === 'string' && 
          template.preview_image_url.includes('X-Amz-Algorithm')) {
        const objectName = extractObjectName(template.preview_image_url);
        if (objectName) {
          hasChanges = true;
          updatedPreviewUrl = generatePublicUrl(objectName);
          console.log(`  ✓ 预览图: ${objectName}`);
        }
      }

      if (hasChanges) {
        const { error: updateError } = await supabase
          .from('templates')
          .update({
            preview_image_url: updatedPreviewUrl,
          })
          .eq('id', template.id);

        if (updateError) {
          console.error(`  ❌ 更新失败 (ID: ${template.id}):`, updateError.message);
        } else {
          updatedCount++;
          console.log(`  ✅ 已更新模板 ID: ${template.id}\n`);
        }
      }
    }

    console.log(`\n✨ 完成！共更新 ${updatedCount} 个模板`);
  } catch (error) {
    console.error('❌ 刷新失败:', error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始刷新数据库中的图片 URL\n');
  console.log('配置信息:');
  console.log(`  MinIO 端点: ${MINIO_ENDPOINT}`);
  console.log(`  Bucket 名称: ${BUCKET_NAME}\n`);

  try {
    await refreshGenerationImages();
    await refreshTemplateImages();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ 所有图片 URL 刷新完成！');
    console.log('='.repeat(50));
    console.log('\n💡 提示:');
    console.log('1. 请确保 MinIO bucket 已设置为公共读');
    console.log('2. 运行 "npx tsx scripts/fix-minio-bucket-policy.ts" 设置权限');
    console.log('3. 刷新浏览器查看效果\n');
  } catch (error) {
    console.error('\n❌ 执行失败:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

