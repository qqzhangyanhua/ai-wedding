/**
 * 修复 MinIO Bucket 权限脚本
 * 
 * 用途：设置 bucket 为公共读，解决 403 错误
 * 运行：npx tsx scripts/fix-minio-bucket-policy.ts
 */

// 加载环境变量
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { getMinioClient } from '../app/lib/minio-client';

// 获取配置
function getConfig() {
  return {
    endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucketName: process.env.MINIO_BUCKET_NAME || 'ai-images',
    useSSL: process.env.MINIO_USE_SSL === 'true',
  };
}

async function fixBucketPolicy() {
  try {
    console.log('🔧 开始修复 MinIO Bucket 权限...\n');
    
    const client = getMinioClient();
    const config = getConfig();
    const bucketName = config.bucketName;

    // 1. 检查 bucket 是否存在
    console.log(`📦 检查 bucket: ${bucketName}`);
    const exists = await client.bucketExists(bucketName);
    
    if (!exists) {
      console.log(`❌ Bucket "${bucketName}" 不存在，正在创建...`);
      await client.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Bucket "${bucketName}" 创建成功\n`);
    } else {
      console.log(`✅ Bucket "${bucketName}" 已存在\n`);
    }

    // 2. 设置公共读策略
    console.log('🔐 设置 Bucket 为公共读策略...');
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };
    
    await client.setBucketPolicy(bucketName, JSON.stringify(policy));
    console.log('✅ 公共读策略设置成功\n');

    // 3. 验证策略
    console.log('🔍 验证策略设置...');
    const currentPolicy = await client.getBucketPolicy(bucketName);
    const parsedPolicy = JSON.parse(currentPolicy);
    console.log('📋 当前策略:', JSON.stringify(parsedPolicy, null, 2));
    
    // 4. 列出部分对象进行测试
    console.log('\n📂 列出前 5 个对象:');
    const stream = client.listObjects(bucketName, '', true);
    let count = 0;
    
    for await (const obj of stream) {
      if (count < 5) {
        console.log(`  - ${obj.name}`);
        
        // 生成公共 URL
        const endpointUrl = new URL(config.endpoint);
        const protocol = config.useSSL ? 'https' : 'http';
        const port = endpointUrl.port ? `:${endpointUrl.port}` : '';
        const publicUrl = `${protocol}://${endpointUrl.hostname}${port}/${bucketName}/${obj.name}`;
        console.log(`    公共 URL: ${publicUrl}\n`);
        
        count++;
      } else {
        break;
      }
    }

    console.log('\n✅ 修复完成！现在你的图片应该可以公开访问了。');
    console.log('\n💡 建议：');
    console.log('1. 如果是生产环境，建议使用 CDN 代理 MinIO');
    console.log('2. 定期检查 bucket 策略是否被修改');
    console.log('3. 考虑使用公共 URL 而不是预签名 URL（修改代码返回 publicUrl）\n');

  } catch (error) {
    console.error('❌ 修复失败:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  fixBucketPolicy()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

