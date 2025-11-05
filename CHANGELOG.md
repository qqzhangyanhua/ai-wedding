# 更新日志

本文档记录项目的重要变更。

---

## [2024-11-05] 修复退出登录会话错误

### 🐛 Bug 修复

**问题：** 退出登录时出现 `session_not_found` 错误

**影响：**
- 正常浏览器退出登录报错
- 退出后用户状态没有清理
- 无痕浏览器工作正常

**根因：**
- 浏览器缓存了过期的 Supabase 会话 token
- `signOut()` 默认调用服务端注销接口，使用过期 token 导致失败
- 服务端报错后，前端状态未被清理

**修复：**
- 优化 `app/contexts/AuthContext.tsx` 中的 `signOut` 函数
- 先清理前端状态（user、profile）
- 清理所有 Supabase 相关的 localStorage
- 使用 `scope: 'local'` 避免调用服务端接口
- 添加错误处理，确保即使失败也能退出

**测试：**
- ✅ TypeScript 类型检查通过
- ✅ ESLint 检查通过
- ✅ 不影响其他认证功能

**文档：**
- [修复总结](./docs/LOGOUT_FIX_SUMMARY.md)
- [详细方案](./docs/SESSION_LOGOUT_FIX.md)
- [测试指南](./docs/LOGOUT_TEST_GUIDE.md)

### 📝 技术细节

```typescript
// 修改前（会报错）
const signOut = async () => {
  await supabase.auth.signOut(); // 默认 scope: 'global'，会调用服务端
};

// 修改后（不会报错）
const signOut = async () => {
  try {
    setUser(null);
    setProfile(null);
    // 清理 localStorage
    await supabase.auth.signOut({ scope: 'local' }); // 仅本地清理
  } catch (error) {
    console.warn('退出登录时发生错误（已忽略）:', error);
  }
};
```

---

## 项目信息

- **技术栈：** Next.js 14 + React + TypeScript + Supabase + Tailwind CSS
- **开发模式：** `pnpm dev`
- **构建：** `pnpm build`
- **类型检查：** `pnpm typecheck`
- **代码检查：** `pnpm lint`

---

## 提交规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式调整（不影响功能）
- `refactor:` 重构（不增加功能，不修复 Bug）
- `perf:` 性能优化
- `test:` 测试相关
- `chore:` 构建工具、依赖更新等

---

## 相关资源

- [仓库指南](./AGENTS.md)
- [数据库架构](./database-schema.sql)
- [API 配置优化](./docs/API_CONFIG_OPTIMIZATION.md)
- [README](./README.md)

---

**最后更新：** 2024-11-05

