import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Next.js 客户端环境变量（需以 NEXT_PUBLIC_ 前缀暴露到客户端）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// 惰性初始化：避免在导入阶段直接抛错；当首次调用 supabase 任意方法时，如果变量缺失再提示
let internalClient: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  internalClient = createClient(supabaseUrl, supabaseAnonKey);
}

// 通过 Proxy 代理在首次访问时检查配置是否就绪
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    if (!internalClient) {
      throw new Error(
        'Supabase 未配置：请在 .env 中设置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY（可参考 .env.example）'
      );
    }
    const value = Reflect.get(internalClient as unknown as object, prop, receiver);
    // 确保方法调用时 this 绑定到 internalClient（避免使用 Function 类型）
    if (typeof value === 'function') {
      return (...args: unknown[]) => Reflect.apply(value as (...a: unknown[]) => unknown, internalClient, args);
    }
    return value;
  },
});
