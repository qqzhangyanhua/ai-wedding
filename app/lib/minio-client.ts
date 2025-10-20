import * as Minio from 'minio';
import { randomUUID } from 'crypto';
import type { MinioConfig, UploadImageOptions, UploadImageResult } from '@/types/storage';

// 从环境变量获取 MinIO 配置
function getMinioConfig(): MinioConfig {
  const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
  const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
  const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
  const bucketName = process.env.MINIO_BUCKET_NAME || 'ai-images';
  const useSSL = process.env.MINIO_USE_SSL === 'true';

  // 解析 endpoint，提取主机和端口
  const endpointUrl = new URL(endpoint);
  const endpointHost = endpointUrl.hostname;
  const endpointPort = endpointUrl.port ? parseInt(endpointUrl.port) : (useSSL ? 443 : 9000);

  return {
    endpoint: endpointHost,
    port: endpointPort,
    accessKey,
    secretKey,
    useSSL,
    bucketName,
  };
}

// 创建 MinIO 客户端单例
let minioClientInstance: Minio.Client | null = null;

export function getMinioClient(): Minio.Client {
  if (!minioClientInstance) {
    const config = getMinioConfig();
    
    minioClientInstance = new Minio.Client({
      endPoint: config.endpoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
  }

  return minioClientInstance;
}

// 确保 bucket 存在
export async function ensureBucketExists(): Promise<void> {
  const client = getMinioClient();
  const config = getMinioConfig();
  const bucketName = config.bucketName;

  try {
    const exists = await client.bucketExists(bucketName);
    if (!exists) {
      await client.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Bucket "${bucketName}" 创建成功`);
      
      // 设置公共读策略
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
      console.log(`✅ Bucket "${bucketName}" 策略设置成功`);
    }
  } catch (error) {
    console.error('❌ 确保 bucket 存在时出错:', error);
    throw error;
  }
}

// 上传图片到 MinIO
export async function uploadImage(options: UploadImageOptions): Promise<UploadImageResult> {
  const client = getMinioClient();
  const config = getMinioConfig();
  const bucketName = config.bucketName;

  // 确保 bucket 存在
  await ensureBucketExists();

  // 生成唯一的对象名称
  const ext = options.originalName 
    ? options.originalName.split('.').pop() 
    : (options.contentType?.split('/')[1] || 'png');
  
  const timestamp = Date.now();
  const uuid = randomUUID();
  const folder = options.folder ? `${options.folder}/` : '';
  const objectName = `${folder}${timestamp}-${uuid}.${ext}`;

  // 确定 Content-Type
  const contentType = options.contentType || 'image/png';

  try {
    // 上传到 MinIO
    await client.putObject(
      bucketName,
      objectName,
      options.buffer,
      options.buffer.length,
      {
        'Content-Type': contentType,
      }
    );

    console.log(`✅ 图片上传成功: ${objectName}`);

    // 生成公共访问 URL（可能不可用）
    const protocol = config.useSSL ? 'https' : 'http';
    const port = config.port === 80 || config.port === 443 ? '' : `:${config.port}`;
    const publicUrl = `${protocol}://${config.endpoint}${port}/${bucketName}/${objectName}`;

    // 生成预签名 URL（7天有效期）
    const presignedUrl = await client.presignedGetObject(bucketName, objectName, 7 * 24 * 60 * 60);

    console.log(`✅ 预签名 URL 生成成功: ${presignedUrl.substring(0, 100)}...`);

    return {
      url: publicUrl, // 默认返回公共 URL（需要 bucket 设置为公共读）
      publicUrl,
      presignedUrl,
      objectName,
      bucket: bucketName,
    };
  } catch (error) {
    console.error('❌ 上传图片到 MinIO 失败:', error);
    throw error;
  }
}

// 从 base64 字符串上传图片
export async function uploadBase64Image(
  base64Data: string,
  options?: Omit<UploadImageOptions, 'buffer'>
): Promise<UploadImageResult> {
  // 解析 base64 数据
  const matches = base64Data.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
  
  if (!matches) {
    throw new Error('无效的 base64 图片数据');
  }

  const imageType = matches[1];
  const base64String = matches[2];
  const buffer = Buffer.from(base64String, 'base64');

  return uploadImage({
    buffer,
    contentType: `image/${imageType}`,
    originalName: options?.originalName,
    folder: options?.folder,
  });
}

// 从 dataURL 上传图片
export async function uploadDataUrlImage(
  dataUrl: string,
  folder?: string
): Promise<UploadImageResult> {
  return uploadBase64Image(dataUrl, { folder });
}

// 删除图片
export async function deleteImage(objectName: string): Promise<void> {
  const client = getMinioClient();
  const config = getMinioConfig();
  const bucketName = config.bucketName;

  try {
    await client.removeObject(bucketName, objectName);
    console.log(`✅ 图片删除成功: ${objectName}`);
  } catch (error) {
    console.error('❌ 删除图片失败:', error);
    throw error;
  }
}

// 批量删除图片
export async function deleteImages(objectNames: string[]): Promise<void> {
  const client = getMinioClient();
  const config = getMinioConfig();
  const bucketName = config.bucketName;

  try {
    await client.removeObjects(bucketName, objectNames);
    console.log(`✅ 批量删除图片成功: ${objectNames.length} 张`);
  } catch (error) {
    console.error('❌ 批量删除图片失败:', error);
    throw error;
  }
}

// 获取图片的预签名 URL（用于临时访问）
export async function getPresignedUrl(
  objectName: string,
  expirySeconds: number = 3600
): Promise<string> {
  const client = getMinioClient();
  const config = getMinioConfig();
  const bucketName = config.bucketName;

  try {
    const url = await client.presignedGetObject(bucketName, objectName, expirySeconds);
    return url;
  } catch (error) {
    console.error('❌ 生成预签名 URL 失败:', error);
    throw error;
  }
}
