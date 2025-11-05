# 退出登录会话错误修复方案

## 问题描述

用户在退出登录时遇到以下错误：

```json
{
  "code": "session_not_found",
  "message": "Session from session_id claim in JWT does not exist"
}
```

**症状：**
- 正常浏览器退出登录时报错
- 无痕浏览器工作正常
- 退出后仍能获取用户信息

## 根本原因

1. **会话过期/无效**：浏览器缓存了已过期或无效的 Supabase 会话 token
2. **服务端注销失败**：调用 `signOut()` 时默认会向服务端发送注销请求，使用过期 token 导致服务端返回错误
3. **前端状态未清理**：即使服务端报错，前端状态（user、profile）没有被清理，导致用户看起来仍处于登录状态

## 解决方案

### 1. 优化退出登录流程

```typescript
const signOut = async () => {
  try {
    // ① 立即清理前端状态
    setUser(null);
    setProfile(null);
    
    // ② 清理本地存储
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
    }
    
    // ③ 仅本地注销，避免服务端调用失败
    await supabase.auth.signOut({ scope: 'local' });
  } catch (error) {
    // ④ 忽略错误，因为本地状态已清理
    console.warn('退出登录时发生错误（已忽略）:', error);
  }
};
```

### 2. 关键改进点

| 改进项 | 说明 | 效果 |
|--------|------|------|
| **先清理状态** | 在调用 Supabase API 前先清理 React 状态 | 确保 UI 立即更新，用户看到退出效果 |
| **清理本地存储** | 删除所有 `sb-` 开头的 localStorage 项 | 清除过期的会话数据 |
| **使用 local scope** | `signOut({ scope: 'local' })` | 仅清理本地，不调用可能失败的服务端接口 |
| **捕获并忽略错误** | try-catch 包裹，控制台警告但不抛出 | 即使服务端失败，用户也能正常退出 |

### 3. scope 参数说明

Supabase `signOut()` 支持两种 scope：

- **`global`**（默认）：同时清理本地和服务端会话
  - 会调用 `/auth/v1/logout?scope=global`
  - 如果 token 过期会报错
  
- **`local`**：仅清理本地浏览器的会话数据
  - 不调用服务端接口
  - 适合处理已过期会话

## 为什么无痕浏览器正常？

无痕浏览器每次都是全新的会话：
- ✅ 没有旧的缓存数据
- ✅ 登录获取的是新鲜的 token
- ✅ 退出时 token 还在有效期内

正常浏览器可能存在：
- ❌ 长期未刷新的页面
- ❌ 会话 token 已超过服务端有效期
- ❌ 缓存的会话状态与服务端不一致

## 测试验证

### 测试场景

1. **正常登录退出**
   - 登录 → 立即退出 ✅
   
2. **长时间停留后退出**
   - 登录 → 停留 24 小时 → 退出 ✅
   
3. **跨标签页退出**
   - 标签 A 登录 → 标签 B 退出 → 标签 A 刷新 ✅

4. **清理验证**
   - 退出后检查 localStorage（应无 `sb-` 开头项）✅
   - 退出后检查 user/profile 状态（应为 null）✅

### 验证命令

```bash
# 开发环境测试
pnpm dev

# 构建生产版本
pnpm build

# 类型检查
pnpm typecheck

# Lint 检查
pnpm lint
```

## 后续优化建议

### 1. 会话刷新策略

考虑添加自动刷新逻辑：

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token 已刷新');
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    }
  );
  
  return () => subscription.unsubscribe();
}, []);
```

### 2. 会话过期提示

在会话即将过期时提示用户：

```typescript
// 检查 token 过期时间
const checkTokenExpiry = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.expires_at) {
    const expiresIn = session.expires_at * 1000 - Date.now();
    if (expiresIn < 5 * 60 * 1000) { // 少于 5 分钟
      // 显示续期提示
    }
  }
};
```

### 3. 全局错误处理

添加 Supabase 请求拦截器，统一处理 401 错误：

```typescript
// 当 API 返回 401 时自动清理状态
const handleAuthError = (error: unknown) => {
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === 'session_not_found' || error.code === 'PGRST301') {
      // 自动清理状态
      setUser(null);
      setProfile(null);
    }
  }
};
```

## 参考资料

- [Supabase Auth 文档](https://supabase.com/docs/reference/javascript/auth-signout)
- [会话管理最佳实践](https://supabase.com/docs/guides/auth/sessions)
- [Token 刷新策略](https://supabase.com/docs/guides/auth/sessions/token-refresh)

## 变更日志

- **2024-11-05**: 修复退出登录会话错误，使用 local scope 避免服务端调用失败

