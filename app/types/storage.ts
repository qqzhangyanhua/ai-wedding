// 存储（MinIO）相关类型

export interface MinioConfig {
  endpoint: string;
  port?: number;
  accessKey: string;
  secretKey: string;
  useSSL: boolean;
  bucketName: string;
}

export interface UploadImageOptions {
  buffer: Buffer;
  originalName?: string;
  contentType?: string;
  folder?: string; // 可选子目录
}

export interface UploadImageResult {
  url: string; // 默认预签名 URL
  publicUrl: string;
  presignedUrl: string;
  objectName: string;
  bucket: string;
}

