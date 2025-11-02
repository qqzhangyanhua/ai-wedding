# AI 婚纱照生成平台 🎨

<div align="center">

一个基于 AI 技术的智能婚纱照生成平台，让用户无需昂贵的摄影服务，即可创造梦幻般的婚纱照片。

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[在线演示](#) | [功能特性](#-核心功能) | [快速开始](#-快速开始) | [文档](#-文档)

</div>

---

## 📖 项目简介

AI 婚纱照生成平台是一个全栈 Web 应用，通过 AI 图像生成技术，让用户上传自己的照片，选择心仪的场景模板（巴黎、东京、冰岛等），即可生成专业级婚纱照。相比传统摄影服务，成本仅为 1/10，且 5 分钟内即可完成。

### 🎯 核心功能

#### 用户端功能
- 🖼️ **智能照片生成**：上传照片 + 选择模板 → AI 生成精美婚纱照
- 🎨 **丰富模板库**：巴黎、圣托里尼、东京樱花、冰岛极光等 10+ 场景
- 🔍 **智能照片识别**：自动验证上传照片是否包含人物，确保生成质量
- 📊 **项目管理**：查看生成历史、管理项目、下载高清图片
- ❤️ **互动功能**：点赞、收藏、分享到公开画廊
- 🌐 **画廊浏览**：欣赏其他用户分享的优秀作品
- 💰 **积分系统**：购买积分、邀请好友获得奖励
- 🔐 **多种登录方式**：支持邮箱/密码、Google OAuth

#### 管理员功能
- 🛠️ **模板管理**：创建、编辑、排序模板
- ⚙️ **模型配置管理**：动态配置 AI 模型 API（无需重启服务）
- 📈 **数据统计**：用户活跃度、生成量、收入等数据分析
- 👥 **用户管理**：查看用户信息、积分管理

### 🏗️ 技术栈

#### 前端
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5.5
- **样式**: TailwindCSS 3.4 + shadcn/ui
- **动画**: GSAP + Framer Motion
- **状态管理**: React Context + Hooks
- **UI 组件**: Radix UI + Lucide Icons

#### 后端
- **运行时**: Node.js 18+ / Edge Runtime
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth (邮箱/密码 + Google OAuth)
- **存储**: MinIO / Supabase Storage
- **API**: Next.js API Routes (RESTful)

#### AI 集成
- **图像生成**: OpenAI DALL-E 3 / Gemini 2.5 Flash Image
- **图像识别**: GPT-4o-mini (人物检测)
- **兼容性**: 支持所有 OpenAI 兼容 API

#### 开发工具
- **包管理**: pnpm
- **代码规范**: ESLint + TypeScript Strict Mode
- **部署**: Vercel / PM2 + Nginx

---

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- pnpm (推荐) / npm / yarn
- Supabase 账号 ([免费注册](https://supabase.com))
- OpenAI API Key 或兼容服务

### 1️⃣ 克隆项目

```bash
git clone https://github.com/your-username/ai-wedding.git
cd ai-wedding
```

### 2️⃣ 安装依赖

```bash
pnpm install
```

### 3️⃣ 配置环境变量

复制环境变量模板并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# Supabase 配置（必填）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI 图像生成配置（必填）
IMAGE_API_MODE=chat                          # 'images' 或 'chat'
IMAGE_API_BASE_URL=https://api.openai.com    # API 基础 URL
IMAGE_API_KEY=sk-your-api-key                # API 密钥
IMAGE_CHAT_MODEL=gpt-4o                      # chat 模式使用的模型
IMAGE_IMAGE_MODEL=dall-e-3                   # images 模式使用的模型

# MinIO 对象存储配置（可选，用于图片存储）
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=ai-images
MINIO_USE_SSL=false

# 服务端密钥（可选，用于 Webhook）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4️⃣ 初始化数据库

在 Supabase Dashboard 的 SQL Editor 中执行以下文件：

1. **基础表结构**: `database-schema.sql`
2. **触发器**: `database-triggers.sql`
3. **模型配置表**: `database-migrations/2025-10-15-create-model-configs.sql`
4. **模板提示词**: `database-migrations/2025-10-14-add-template-prompt-list.sql`

### 5️⃣ 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

---

## 🔐 Google 登录配置

### 1. Google Cloud Console 配置

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目 → **API 和服务** → **OAuth 同意屏幕**
3. 创建 **OAuth 2.0 客户端 ID**（Web 应用）
4. 添加授权重定向 URI：
   ```
   https://<your-supabase-project>.supabase.co/auth/v1/callback
   ```
5. 记录 **Client ID** 和 **Client Secret**

### 2. Supabase 配置

1. Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. 启用 Google Provider，填入 Client ID 和 Client Secret
3. **URL Configuration**：
   - Site URL: `http://localhost:3000` (本地) / `https://your-domain.com` (生产)
   - Redirect URLs: 添加 `http://localhost:3000/auth/callback`

### 3. 验证

1. 启动应用，点击"使用 Google 登录"
2. 完成 Google 认证后自动跳转回应用
3. 右上角显示用户头像，表示登录成功

---

## 📂 项目结构

```
ai-wedding/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── generate-image/       # 图片生成（标准模式）
│   │   ├── generate-stream/      # 图片生成（流式模式）
│   │   ├── identify-image/       # 图片识别（人物检测）
│   │   ├── upload-image/         # 图片上传
│   │   ├── gallery/              # 画廊 API
│   │   ├── orders/               # 订单管理
│   │   ├── invite/               # 邀请系统
│   │   └── admin/                # 管理员 API
│   ├── components/               # React 组件
│   │   ├── HomePage.tsx          # 首页
│   │   ├── CreatePage.tsx        # 创建项目页
│   │   ├── DashboardPage.tsx     # 仪表盘
│   │   ├── TemplatesPage.tsx     # 模板浏览
│   │   ├── PricingPage.tsx       # 价格页
│   │   ├── PhotoUploader.tsx     # 照片上传组件
│   │   ├── admin/                # 管理员组件
│   │   └── ui/                   # UI 基础组件
│   ├── contexts/                 # React Context
│   │   └── AuthContext.tsx       # 认证上下文
│   ├── hooks/                    # 自定义 Hooks
│   │   ├── useProjects.ts        # 项目管理
│   │   ├── useImageGeneration.ts # 图片生成
│   │   ├── useTemplates.ts       # 模板管理
│   │   └── ...
│   ├── lib/                      # 工具函数
│   │   ├── supabase.ts           # Supabase 客户端
│   │   ├── validations.ts        # Zod 验证
│   │   └── ...
│   ├── types/                    # TypeScript 类型定义
│   └── layout.tsx                # 根布局
├── database-migrations/          # 数据库迁移脚本
├── database-schema.sql           # 数据库表结构
├── database-triggers.sql         # 数据库触发器
├── docs/                         # 项目文档
│   ├── MODEL_CONFIG_FEATURE.md   # 模型配置功能
│   ├── IMAGE_IDENTIFICATION_FEATURE.md  # 图片识别功能
│   ├── STREAMING_IMAGE_API.md    # 流式生成 API
│   └── ...
├── scripts/                      # 运维脚本
│   ├── deploy.sh                 # 部署脚本
│   ├── fix-minio-403.sh          # MinIO 修复脚本
│   └── start-pm2.sh              # PM2 启动脚本
├── .env.example                  # 环境变量模板
├── package.json                  # 项目依赖
├── tailwind.config.js            # Tailwind 配置
└── tsconfig.json                 # TypeScript 配置
```

---

## 🛠️ 开发指南

### 常用命令

```bash
# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# 类型检查
pnpm typecheck

# MinIO 相关
pnpm fix-minio          # 修复 MinIO 403 错误
pnpm fix-minio:policy   # 修复存储桶策略
pnpm fix-minio:urls     # 刷新图片 URL

# PM2 部署（生产环境）
pnpm pm2:start          # 启动服务
pnpm pm2:stop           # 停止服务
pnpm pm2:restart        # 重启服务
pnpm pm2:logs           # 查看日志
```

### 代码规范

- **TypeScript**: 严格模式，禁止使用 `any`
- **组件**: 单个组件不超过 400 行，复杂组件需拆分
- **样式**: 优先使用 Tailwind CSS，避免自定义 CSS
- **命名**: 组件使用 PascalCase，Hooks 以 `use` 开头
- **提交**: 遵循 Conventional Commits 规范

### 环境变量说明

#### 必填变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGc...` |
| `IMAGE_API_KEY` | AI 图像生成 API 密钥 | `sk-...` |

#### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `IMAGE_API_MODE` | API 模式 (`images` / `chat`) | `images` |
| `IMAGE_API_BASE_URL` | API 基础 URL | `https://api.openai.com` |
| `IMAGE_IMAGE_MODEL` | images 模式模型 | `dall-e-3` |
| `IMAGE_CHAT_MODEL` | chat 模式模型 | `gpt-4o` |
| `MINIO_ENDPOINT` | MinIO 端点 | `http://localhost:9000` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥 | - |

---

## 📚 文档

详细文档请查看 `docs/` 目录：

- [模型配置管理](docs/MODEL_CONFIG_FEATURE.md) - 动态管理 AI 模型配置
- [图片识别功能](docs/IMAGE_IDENTIFICATION_FEATURE.md) - 人物检测与验证
- [流式图片生成](docs/STREAMING_IMAGE_API.md) - 实时生成反馈
- [画廊分享功能](GALLERY_FEATURE_SUMMARY.md) - 作品分享与展示
- [MinIO 配置指南](docs/MINIO_403_FIX.md) - 对象存储配置
- [提示词优化](docs/prompt-optimization-v3-success-case.md) - 提高生成质量

---

## 🚢 部署

### Vercel 部署（推荐）

1. Fork 本项目到你的 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量（与 `.env` 相同）
4. 点击 Deploy

### 自托管部署

使用 PM2 进行生产部署：

```bash
# 构建项目
pnpm build

# 启动 PM2
pnpm pm2:start

# 查看状态
pnpm pm2:status
```

详细部署文档请参考 [DEPLOYMENT.md](DEPLOYMENT.md)。

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建/工具链更新

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Supabase](https://supabase.com/) - 后端即服务
- [TailwindCSS](https://tailwindcss.com/) - CSS 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [OpenAI](https://openai.com/) - AI 图像生成
- [Pexels](https://www.pexels.com/) - 免费图片素材

---

## 📞 联系方式

- 项目地址: [GitHub](https://github.com/your-username/ai-wedding)
- 问题反馈: [Issues](https://github.com/your-username/ai-wedding/issues)
- 讨论交流: [Discussions](https://github.com/your-username/ai-wedding/discussions)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star 支持一下！**

Made with ❤️ by AI Wedding Team

</div>
