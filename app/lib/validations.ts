import { z } from 'zod';

/**
 * 用户认证验证
 */
export const SignUpSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(8, '密码至少需要8个字符')
    .max(100, '密码不能超过100个字符')
    .regex(/[A-Z]/, '密码必须包含至少一个大写字母')
    .regex(/[a-z]/, '密码必须包含至少一个小写字母')
    .regex(/[0-9]/, '密码必须包含至少一个数字'),
  fullName: z
    .string()
    .min(2, '姓名至少需要2个字符')
    .max(50, '姓名不能超过50个字符'),
});

export const SignInSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
});

/**
 * 项目创建验证
 */
export const CreateProjectSchema = z.object({
  name: z
    .string()
    .min(1, '项目名称不能为空')
    .max(100, '项目名称不能超过100个字符'),
  templateId: z.string().uuid('无效的模板ID'),
  uploadedPhotos: z
    .array(z.string().url('无效的图片URL'))
    .min(1, '至少需要上传1张照片')
    .max(10, '最多只能上传10张照片'),
});

/**
 * AI图片生成验证
 */
export const GenerateImageSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt不能为空')
    .max(1500, 'Prompt不能超过1500个字符'),
  n: z.number().int().min(1).max(8).default(1),
  size: z.enum(['256x256', '512x512', '1024x1024']).default('1024x1024'),
  response_format: z.enum(['url', 'b64_json']).default('url'),
  model: z.string().optional(),
  // 可选：图像输入（data URL），用于 chat/completions 图像编辑/条件生成
  image_inputs: z.array(z.string()).max(3).optional(),
  // 可选：模型来源
  source: z.enum(['openRouter', '302', 'openAi']).optional(),
});

/**
 * 订单创建验证
 */
export const CreateOrderSchema = z.object({
  plan: z.enum(['Starter', 'Popular', 'Premium'], {
    message: '无效的套餐类型',
  }),
  generationId: z.string().uuid().optional(),
  selectedImages: z.array(z.number().int().min(0)).optional(),
});

/**
 * 图片下载追踪验证
 */
export const TrackDownloadSchema = z.object({
  generation_id: z.string().uuid('无效的生成ID'),
  index: z.number().int().min(0, '无效的图片索引'),
  image_type: z.enum(['preview', 'high_res']).default('preview'),
});

/**
 * 分页参数验证
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(20),
});

/**
 * 搜索查询验证
 */
export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  category: z.string().optional(),
  sortBy: z.enum(['created_at', 'name', 'price']).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * 模板筛选验证
 */
export const TemplateFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});

/**
 * 辅助函数：验证并解析数据
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError.message,
      };
    }
    return {
      success: false,
      error: '验证失败',
    };
  }
}

/**
 * 辅助函数：安全解析（不抛出错误）
 */
export function safeParseData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// 导出类型
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type GenerateImageInput = z.infer<typeof GenerateImageSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type TrackDownloadInput = z.infer<typeof TrackDownloadSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
export type TemplateFilterInput = z.infer<typeof TemplateFilterSchema>;
