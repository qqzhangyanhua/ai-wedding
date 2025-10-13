ai-wedding

项目简介
- 技术栈：Next.js 14（App Router）+ React 18 + TypeScript + TailwindCSS + Supabase + shadcn/ui。
- 主要功能：模板浏览、创建项目、AI 图片生成、结果预览、积分购买（占位流程）。

本地运行
1) 克隆并安装依赖
   - 需要 Node.js 18+
   - 安装依赖：pnpm i 或 npm i 或 yarn（任选其一）

2) 配置环境变量
   - 复制 `.env.example` 为 `.env`
   - 必填：
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - 图片生成（服务端，密钥不暴露到前端）：
     - `IMAGE_API_MODE`：`images`（默认，调用 `/v1/images/generations`）或 `chat`（调用 `/v1/chat/completions` 并从 Markdown 提取 Base64 图片，参考 example/image-edit-demo.html）
     - `IMAGE_API_BASE_URL`：例如 `https://api.openai.com` 或 `https://api.aioec.tech`
     - `IMAGE_API_KEY`
     - `IMAGE_IMAGE_MODEL`：`images` 模式下的模型（默认 `dall-e-3`）
     - `IMAGE_CHAT_MODEL`：`chat` 模式下的图像模型（例如 `gemini-2.5-flash-image`）
   - 兼容：若未设置 `IMAGE_*`，将回退至 `OPENAI_*`（`OPENAI_BASE_URL`、`OPENAI_API_KEY`、`OPENAI_IMAGE_MODEL`）
   - 其他可选：
     - `SUPABASE_SERVICE_ROLE_KEY`（仅服务端使用）
     - `STRIPE_WEBHOOK_SECRET`（如接入 Stripe Webhook）

3) 初始化数据库（可选但推荐）
   - 将根目录 `database-schema.sql` 中的 SQL 在 Supabase SQL Editor 执行
   - 包含 RLS 策略、索引与示例模板数据

4) 启动开发服务器
   - npm run dev

常用脚本
- `npm run dev`：开发模式
- `npm run build`：构建
- `npm run start`：启动生产
- `npm run lint`：ESLint 规则校验
- `npm run typecheck`：TypeScript 严格类型检查

注意事项与最佳实践
- 构建产物忽略：已在 `.gitignore` 忽略 `.next/`, `out/`, `.vercel/`, `tsconfig.tsbuildinfo`。
- Supabase 客户端惰性初始化：当环境变量缺失时，不会在导入阶段崩溃，而是在首次调用时报出清晰错误提示。
- 生成 API：`app/api/generate-image/route.ts` 服务端安全调用 OpenAI 兼容接口，不会在客户端暴露密钥。
- 数据获取：`useProjects` 对 `generations` 增加降序排序，确保拿到最新生成记录。
 - 支付闭环：已提供“下单 + 模拟回调”流程；并提供 Stripe Webhook 骨架（`app/api/orders/webhook/stripe/route.ts`）。上线时将“模拟回调”替换为真实支付网关回调。

后续计划（建议）
- 积分购买：从前端直接改积分升级为“服务端下单 + 支付回调（Webhook）写库”。
 - Webhook：生产需使用服务端密钥（`SUPABASE_SERVICE_ROLE_KEY`）以绕过 RLS，验证签名并做好幂等；参考 `app/api/orders/webhook/stripe/route.ts`。
- 组件迁移：将 `src/views/*` 逐步拆分为纯组件，由 `app/*` 页面壳负责数据与路由。
- 图片优化：逐步替换 `<img>` 为 `next/image`（已配置 `images.pexels.com` 域名）。
