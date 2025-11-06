# 优化用户信息获取 - 避免重复 API 调用

## 问题背景

在之前的实现中，`useStreamImageGeneration` hook 在保存生成记录到数据库时，会调用 `supabase.auth.getUser()` 来获取用户 ID：

```typescript
// ❌ 不合理的设计
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  console.warn('无法获取用户信息，跳过保存到数据库');
  return;
}
```

这会导致以下问题：

1. **重复 API 调用**：每次生成图片都会额外发起一个 `/auth/v1/user` 请求
2. **性能浪费**：用户信息已经在应用启动时获取并缓存在 `AuthContext` 中
3. **架构不合理**：违反了单一数据源原则（Single Source of Truth）

## 解决方案

### 使用 AuthContext 作为唯一数据源

项目使用 React Context（`AuthContext`）来管理全局的用户认证状态：

```typescript
// app/contexts/AuthContext.tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // 在应用启动时获取用户信息
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });
  }, []);
  
  // ...
}
```

### 修改后的实现

在 `useStreamImageGeneration` 中直接使用 `AuthContext` 的 `user` 对象：

```typescript
// app/hooks/useStreamImageGeneration.ts
import { useAuth } from '@/contexts/AuthContext';

export function useStreamImageGeneration({ onError, onSuccess }: UseStreamImageGenerationProps) {
  const { user } = useAuth(); // ✅ 从 Context 获取用户信息
  
  const uploadGeneratedImageToMinio = async (
    imageDataUrl: string,
    originalImage: string,
    prompt: string,
    settings: ImageGenerationSettings
  ): Promise<void> => {
    // ...
    
    // ✅ 直接使用 Context 中的 user，无需额外 API 调用
    if (!user?.id) {
      console.warn('用户未登录，跳过保存到数据库');
      return;
    }
    
    const { error: dbError } = await supabase
      .from('single_generations')
      .insert({
        user_id: user.id,  // ✅ 从 AuthContext 获取
        // ...
      });
  };
}
```

## 优化效果

### 性能提升
- **减少 HTTP 请求**：每次生成图片节省 1 个 API 调用
- **降低延迟**：不需要等待额外的网络请求
- **减少服务器负载**：减少不必要的认证请求

### 架构改进
- **单一数据源**：用户信息统一由 `AuthContext` 管理
- **更好的可维护性**：状态管理更清晰，易于追踪
- **更好的类型安全**：TypeScript 可以更好地推断类型

### 代码质量
- **更简洁**：减少了冗余代码
- **更一致**：与项目其他部分的做法保持一致
- **更可靠**：减少了潜在的竞态条件

## 设计原则

### 1. 单一数据源（Single Source of Truth）
- 用户认证状态应该只有一个权威来源
- 所有组件都应该从这个来源获取数据
- 避免在多个地方重复获取和存储相同的数据

### 2. 避免重复请求
- 已经获取的数据应该被缓存和复用
- 只在必要时（如数据过期、用户主动刷新）才重新获取
- 使用 Context、Redux、Zustand 等状态管理工具来共享数据

### 3. 性能优先
- 减少不必要的网络请求
- 优化用户体验（减少等待时间）
- 降低服务器负载

## 相关文件

- `app/contexts/AuthContext.tsx` - 用户认证状态管理
- `app/hooks/useStreamImageGeneration.ts` - 图片生成 Hook（已优化）
- `app/types/database.ts` - 数据库类型定义

## 最佳实践

在其他需要用户信息的地方，也应该遵循相同的原则：

```typescript
// ✅ 推荐：使用 AuthContext
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, profile } = useAuth();
  
  if (!user) {
    return <div>请先登录</div>;
  }
  
  return <div>欢迎，{profile?.full_name}</div>;
}

// ❌ 不推荐：重复调用 API
function MyComponent() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);
  
  // ...
}
```

## 总结

通过使用 `AuthContext` 作为用户信息的唯一数据源，我们：
1. **消除了重复的 API 调用**（`/auth/v1/user`）
2. **提升了应用性能**（减少网络请求和延迟）
3. **改进了代码架构**（单一数据源，更易维护）
4. **遵循了 React 最佳实践**（使用 Context 共享全局状态）

这是一个更合理、更高效的设计方案。

