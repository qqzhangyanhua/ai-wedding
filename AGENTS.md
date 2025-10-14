# Repository Guidelines

## 项目结构与模块组织
- 技术栈：Vite + React + TypeScript + TailwindCSS + Supabase。
- 源码位于 `src/`：
  - 视图：`src/views/*Page.tsx`
  - 组件：`src/components/*.tsx`
  - Hooks：`src/hooks/use*.ts`
  - 上下文：`src/contexts/*Context.tsx`
  - 客户端/工具：`src/lib/`（如 `supabase.ts`）
  - 类型定义：`src/types/`
  - 示例数据：`src/data/`
- 入口与样式：`index.html`、`src/index.css`
- 数据库参考：`database-schema.sql`（演示用途，勿直接用于生产）。

## 构建、测试与本地开发
- `npm run dev`：启动 Vite 开发服务器。
- `npm run build`：构建产物到 `dist/`。
- `npm run preview`：本地预览生产包。
- `npm run lint`：执行 ESLint 规则校验。
- `npm run typecheck`：TypeScript 严格类型检查。

## 代码风格与命名约定
- 语言：TypeScript；缩进 2 空格；尽量避免 `any`。
- 组件使用 PascalCase（如 `AuthModal.tsx`）；Hook 以 `use` 开头（如 `useProjects.ts`）。
- 文件后缀：组件 `*.tsx`；工具/类型 `*.ts`。
- 提交前需通过：`npm run lint && npm run typecheck`。

## 测试规范
- 建议接入：Vitest + Testing Library。
- 命名：`*.test.ts` / `*.test.tsx`（同目录或 `src/__tests__/`）。
- 覆盖率：核心模块建议 ≥80%。
- 运行：完成集成后使用 `npm test` 或 `vitest`。

## 提交与 Pull Request 指南
- 提交信息：Conventional Commits（如 `feat: add pricing page`，`fix: handle auth error`）。
- PR 要求：
  - 说明变更与动机，关联 Issue（如 `Closes #123`）。
  - UI 改动附截图/录屏。
  - 自检通过：`npm run lint && npm run typecheck && npm run build`。

## 安全与配置提示（可选）
- 环境变量：在 `.env` 配置 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`（勿提交到仓库）。
- 区分本地/生产配置；谨慎处理日志与监控，避免泄露隐私信息。

