# AI 婚纱照生成平台 🎨

<div align="center">

一个基于 AI 技术的智能婚纱照生成平台，让用户无需昂贵的摄影服务，即可创造梦幻般的婚纱照片。

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[在线演示](#) | [功能特性](#-核心功能) | [快速开始](#-快速开始) | [使用指南](#-使用指南) | [文档](#-文档)

</div>

---

## 📖 项目简介

AI 婚纱照生成平台是一个全栈 Web 应用，通过 AI 图像生成技术，让用户上传自己的照片，选择心仪的场景模板（巴黎、东京、冰岛等），即可生成专业级婚纱照。相比传统摄影服务，成本仅为 1/10，且 5 分钟内即可完成。

### ✨ 核心亮点

- 💡 **智能 AI 生成**：基于先进的 AI 模型（DALL-E 3 / Gemini 2.5），生成高质量婚纱照
- 🎯 **人物识别验证**：自动检测上传照片是否包含人物，确保生成效果
- 🚀 **快速生成**：平均 2-5 分钟即可完成，无需等待
- 💰 **经济实惠**：成本仅为传统摄影服务的 1/10
- 🎨 **丰富模板**：10+ 精美场景模板，持续更新
- 🔧 **灵活配置**：管理员可动态配置 AI 模型，无需重启服务
- 📱 **响应式设计**：完美支持桌面端和移动端

### 🎯 核心功能

#### 用户端功能
- 🖼️ **智能照片生成**
  - 支持单人/双人照片上传
  - 自动人物识别验证
  - 实时生成进度显示
  - 高清图片下载（支持批量下载）
  
- 🎨 **丰富模板库**
  - 10+ 精美场景模板（巴黎、圣托里尼、东京樱花、冰岛极光等）
  - 支持模板预览和详情查看
  - 模板分类和标签筛选
  - 实时更新最新模板
  
- 🔍 **智能照片识别**
  - 基于 GPT-4o-mini 的人物检测
  - 自动验证照片质量
  - 实时反馈识别结果
  - 防止无效照片上传
  
- 📊 **项目管理**
  - 查看所有生成项目
  - 项目状态实时更新（生成中/已完成/失败）
  - 项目详情查看（包含所有生成图片）
  - 项目编辑和删除
  - 项目统计图表
  
- ❤️ **互动功能**
  - 点赞喜欢的作品
  - 收藏优秀作品到个人收藏夹
  - 分享作品到公开画廊
  - 查看作品的点赞和浏览数
  
- 🌐 **画廊浏览**
  - 浏览所有公开分享的作品
  - 按热度/最新排序
  - 作品详情查看
  - 点赞和收藏功能
  
- 💰 **积分系统**
  - 多种积分套餐选择
  - 邀请好友获得积分奖励
  - 积分消费记录查询
  - 订单管理
  
- 🔐 **多种登录方式**
  - 邮箱/密码注册登录
  - Google OAuth 快速登录
  - 自动保持登录状态
  - 安全的会话管理

#### 管理员功能
- 🛠️ **模板管理**
  - 创建新模板（支持图片上传）
  - 编辑模板信息（名称、描述、提示词）
  - 模板排序和启用/禁用
  - 批量管理模板
  - 模板使用统计
  
- ⚙️ **模型配置管理**
  - 动态配置 AI 模型 API（无需重启服务）
  - 支持多个模型配置（图片生成、图片识别）
  - 实时切换激活的模型
  - API 密钥安全管理
  - 模型配置测试
  
- 📈 **数据统计**
  - 用户活跃度分析
  - 生成量统计
  - 收入数据分析
  - 模板使用排行
  - 实时数据更新
  
- 👥 **用户管理**
  - 查看所有用户信息
  - 用户积分管理
  - 用户生成记录
  - 用户行为分析

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

## 📱 使用指南

### 用户端使用流程

#### 1. 注册/登录

首次使用需要注册账号，支持两种方式：

**方式一：邮箱注册**
1. 点击右上角"登录"按钮
2. 选择"注册"标签
3. 输入邮箱和密码（密码至少 6 位）
4. 点击"注册"完成账号创建

**方式二：Google 快速登录**
1. 点击"使用 Google 登录"按钮
2. 选择 Google 账号
3. 授权后自动完成登录

#### 2. 创建婚纱照项目

**步骤 1：上传照片**
1. 进入"创建项目"页面
2. 点击"上传照片"区域
3. 选择要生成婚纱照的照片（支持单人/双人照）
4. 系统自动进行人物识别验证
5. 验证通过后显示照片预览

**照片要求：**
- 格式：JPG、PNG、WEBP
- 大小：不超过 10MB
- 内容：必须包含清晰的人物面部
- 建议：光线充足、人物居中、背景简洁

**步骤 2：选择模板**
1. 浏览模板库，查看不同场景
2. 点击模板查看详情和示例
3. 选择心仪的模板（可多选）

**步骤 3：填写项目信息**
1. 输入项目名称（如"我们的巴黎婚纱照"）
2. 选择生成数量（每个模板生成 1-4 张）
3. 查看所需积分

**步骤 4：开始生成**
1. 确认信息无误后点击"开始生成"
2. 系统自动扣除积分并开始 AI 生成
3. 可在仪表盘查看生成进度

#### 3. 查看生成结果

**实时进度查看**
- 进入"我的项目"页面
- 查看项目状态：
  - 🔄 生成中：显示进度百分比和预计时间
  - ✅ 已完成：显示生成的图片数量
  - ❌ 失败：显示错误信息

**查看项目详情**
1. 点击项目卡片进入详情页
2. 查看所有生成的图片
3. 支持图片放大预览
4. 可下载单张或批量下载

**图片操作**
- 💾 **下载**：下载高清原图
- ❤️ **点赞**：标记喜欢的作品
- 🔗 **分享**：分享到公开画廊
- 🗑️ **删除**：删除不满意的图片

#### 4. 画廊浏览

**浏览公开作品**
1. 进入"画廊"页面
2. 浏览其他用户分享的优秀作品
3. 按热度/最新排序
4. 点击作品查看大图

**互动功能**
- ❤️ 点赞喜欢的作品
- ⭐ 收藏到个人收藏夹
- 👁️ 查看作品详情

#### 5. 积分管理

**查看积分余额**
- 右上角显示当前积分数
- 点击可查看积分明细

**购买积分**
1. 进入"价格"页面
2. 选择合适的积分套餐
3. 完成支付（支持多种支付方式）
4. 积分自动到账

**邀请好友获得积分**
1. 进入"我的项目"页面
2. 点击"邀请好友"
3. 复制邀请链接分享给好友
4. 好友注册后双方都获得积分奖励

### 管理员使用指南

#### 1. 模板管理

![模板管理界面](docs/image.png)

**创建新模板**
1. 进入管理后台 → 模板管理
2. 点击"新建模板"按钮
3. 填写模板信息：
   - 模板名称（如"韩式室内婚纱照风格"）
   - 模板描述
   - 场景类型（经典/浪漫/现代等）
   - 上传模板预览图
   - 配置提示词列表（用于 AI 生成）
4. 设置模板排序和状态
5. 点击"保存"完成创建

**编辑模板**
1. 在模板列表中找到要编辑的模板
2. 点击"编辑"按钮
3. 修改模板信息
4. 保存更改

**管理模板**
- 🔄 **复制**：快速创建相似模板
- 🔧 **启用/停用**：控制模板是否对用户可见
- 📊 **查看统计**：查看模板使用次数和评分
- 🗑️ **删除**：删除不再使用的模板

**提示词配置**
- 每个模板支持配置多个提示词
- 系统会随机选择一个提示词进行生成
- 提示词应包含场景描述、风格要求、质量要求等
- 示例：
  ```
  A professional wedding photo in Korean studio style, 
  elegant white wedding dress, modern minimalist background,
  soft lighting, high quality, 8K resolution
  ```

#### 2. 模型配置管理

![模型配置管理界面](docs/image%20copy.png)

**配置说明**
系统支持配置多个 AI 模型，用于不同的功能：
- **图片生成**：用于生成婚纱照（如 DALL-E 3、Gemini 2.5）
- **图片识别**：用于人物检测（如 GPT-4o-mini）

**创建新配置**
1. 进入管理后台 → 模型配置管理
2. 点击"新建配置"按钮
3. 填写配置信息：
   - 配置名称（如"默认图片生成配置"）
   - 用途类型（图片生成/图片识别）
   - API Base URL（如 `https://api.openai.com`）
   - API Key（安全加密存储）
   - 模型名称（如 `dall-e-3`、`gpt-4o-mini`）
4. 点击"保存"完成创建

**激活配置**
1. 在配置列表中找到要使用的配置
2. 点击"激活"按钮
3. 系统立即切换到新配置（无需重启）
4. 绿色标签表示当前激活的配置

**配置管理**
- ✏️ **编辑**：修改配置信息
- 🔄 **切换**：快速切换不同的模型配置
- 🧪 **测试**：测试配置是否可用
- 🗑️ **删除**：删除不再使用的配置

**支持的 API 类型**
- OpenAI API（官方）
- OpenAI 兼容 API（如 302.AI、SiliconFlow 等）
- 自定义 API 端点

**配置优势**
- ✅ 无需重启服务即可切换模型
- ✅ 支持多个备用配置
- ✅ API 密钥安全加密存储
- ✅ 实时生效，不影响正在进行的任务

#### 3. 数据统计

**查看统计数据**
1. 进入管理后台首页
2. 查看关键指标：
   - 总用户数
   - 今日新增用户
   - 总生成数
   - 今日生成数
   - 总收入
   - 今日收入

**统计图表**
- 用户增长趋势图
- 生成量趋势图
- 收入趋势图
- 模板使用排行榜

#### 4. 用户管理

**查看用户列表**
1. 进入管理后台 → 用户管理
2. 查看所有注册用户信息
3. 支持搜索和筛选

**用户操作**
- 查看用户详细信息
- 调整用户积分
- 查看用户生成记录
- 封禁/解封用户

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

### 功能文档

详细功能文档请查看 `docs/` 目录：

- [模型配置管理](docs/MODEL_CONFIG_FEATURE.md) - 动态管理 AI 模型配置，无需重启服务
- [图片识别功能](docs/IMAGE_IDENTIFICATION_FEATURE.md) - 基于 GPT-4o-mini 的人物检测与验证
- [流式图片生成](docs/STREAMING_IMAGE_API.md) - 实时生成反馈，提升用户体验
- [画廊分享功能](GALLERY_FEATURE_SUMMARY.md) - 作品分享、点赞、收藏系统
- [单图生成功能](docs/GENERATE_SINGLE_FEATURE.md) - 快速生成单张婚纱照
- [图片验证与上传](docs/IMAGE_VALIDATION_AND_UPLOAD.md) - 完整的图片处理流程

### 配置文档

- [MinIO 配置指南](docs/MINIO_403_FIX.md) - 对象存储配置与 403 错误修复
- [API 配置优化](docs/API_CONFIG_OPTIMIZATION.md) - API 配置最佳实践
- [提示词优化 V3](docs/prompt-optimization-v3-success-case.md) - 提高生成质量的提示词策略
- [提示词优化 V2](docs/prompt-optimization-v2-demo-best-practices.md) - 提示词最佳实践
- [人脸保留优化](docs/prompt-optimization-face-preservation.md) - 保持人物特征的技巧

### 开发文档

- [调试指南](docs/DEBUG_GUIDE.md) - 常见问题排查与解决
- [轮询机制](docs/POLLING_MECHANISM.md) - 生成状态轮询实现
- [结果页更新](docs/RESULTS_PAGE_UPDATE.md) - 结果页面功能说明
- [CreatePage 优化](docs/CREATEPAGE_OPTIMIZATION.md) - 创建页面性能优化
- [提示词列表优化](docs/PROMPT_LIST_OPTIMIZATION.md) - 提示词管理优化

---

## 🎯 最佳实践

### 照片上传建议

为了获得最佳的生成效果，请遵循以下建议：

**✅ 推荐的照片特征**
- 📸 **清晰度**：照片清晰，无模糊
- 💡 **光线**：光线充足，面部清晰可见
- 👤 **人物**：人物居中，面部完整
- 🎨 **背景**：背景简洁，不要过于复杂
- 📏 **尺寸**：建议 1024x1024 或更高分辨率
- 🎭 **表情**：自然的表情和姿势

**❌ 避免的照片特征**
- 🚫 模糊、失焦的照片
- 🚫 光线过暗或过曝
- 🚫 人物被遮挡或不完整
- 🚫 背景过于杂乱
- 🚫 多人合照（除非是情侣照）
- 🚫 侧脸或背影照片

### 模板选择建议

**根据场景选择**
- 🏛️ **经典场景**：巴黎埃菲尔铁塔、圣托里尼蓝顶教堂
- 🌸 **浪漫场景**：东京樱花、薰衣草花田
- 🏔️ **自然场景**：冰岛极光、瑞士雪山
- 🏰 **复古场景**：欧式城堡、中式园林
- 🌆 **现代场景**：都市夜景、摩登建筑

**根据风格选择**
- 💒 **韩式风格**：简约、清新、室内棚拍
- 🎎 **中式风格**：传统、喜庆、红色主题
- 🗼 **欧式风格**：浪漫、优雅、户外场景
- 🌊 **海景风格**：清爽、自然、海边场景

### 生成参数建议

**生成数量**
- 🎯 **首次尝试**：建议生成 2-3 张，测试效果
- 📊 **批量生成**：满意后可批量生成 4-8 张
- 💰 **积分优化**：根据积分余额合理规划

**模板组合**
- 🎨 建议选择 2-3 个不同风格的模板
- 🔄 避免选择过于相似的模板
- ⚖️ 平衡经典场景和创意场景

### 性能优化建议

**前端优化**
- 🖼️ 图片懒加载，提升页面加载速度
- 📦 组件按需加载，减少首屏体积
- 🔄 使用 React.memo 避免不必要的重渲染
- 💾 合理使用缓存，减少 API 调用

**后端优化**
- 🚀 使用 Edge Runtime 提升响应速度
- 📊 数据库查询优化，添加合适的索引
- 🔐 API 请求限流，防止滥用
- 📝 日志记录，便于问题排查

**数据库优化**
- 📈 定期清理过期数据
- 🔍 为常用查询字段添加索引
- 🔄 使用数据库触发器自动更新统计数据
- 💾 合理使用 RLS（Row Level Security）策略

---

## 🔧 常见问题

### 用户端问题

**Q: 上传照片后提示"未检测到人物"怎么办？**

A: 请确保：
1. 照片中有清晰的人物面部
2. 光线充足，面部不被遮挡
3. 照片质量良好，不模糊
4. 如果是侧脸或背影，请更换正面照片

**Q: 生成的照片不满意怎么办？**

A: 可以尝试：
1. 更换更清晰的原始照片
2. 选择不同的模板
3. 多生成几次，选择最满意的
4. 联系客服获取专业建议

**Q: 积分不足怎么办？**

A: 可以通过以下方式获取积分：
1. 购买积分套餐
2. 邀请好友注册（双方都获得积分）
3. 参与平台活动获得奖励

**Q: 生成时间过长怎么办？**

A: 生成时间受多种因素影响：
1. 正常情况下 2-5 分钟完成
2. 高峰期可能需要更长时间
3. 可以先关闭页面，稍后查看结果
4. 系统会在生成完成后发送通知

### 管理员问题

**Q: 如何切换 AI 模型？**

A: 
1. 进入管理后台 → 模型配置管理
2. 创建新的模型配置
3. 点击"激活"按钮
4. 系统立即切换，无需重启

**Q: 如何优化提示词以提高生成质量？**

A: 参考以下建议：
1. 明确描述场景和风格
2. 添加质量要求（如 "high quality", "8K resolution"）
3. 包含光线和氛围描述
4. 参考 [提示词优化文档](docs/prompt-optimization-v3-success-case.md)

**Q: MinIO 出现 403 错误怎么办？**

A: 
1. 检查存储桶策略是否正确
2. 运行修复脚本：`pnpm fix-minio`
3. 参考 [MinIO 配置指南](docs/MINIO_403_FIX.md)

**Q: 如何备份数据？**

A: 
1. 定期备份 Supabase 数据库
2. 备份 MinIO 存储桶中的图片
3. 导出重要配置信息
4. 建议每周备份一次

### 开发问题

**Q: 本地开发时如何配置环境变量？**

A: 
1. 复制 `.env.example` 为 `.env`
2. 填写必要的配置信息
3. 确保 Supabase 和 AI API 配置正确
4. 参考 [快速开始](#-快速开始) 章节

**Q: 如何调试 API 错误？**

A: 
1. 查看浏览器控制台的错误信息
2. 检查 API 响应状态码和错误消息
3. 查看服务器日志
4. 参考 [调试指南](docs/DEBUG_GUIDE.md)

**Q: 如何添加新的模板？**

A: 
1. 准备模板预览图（建议 1024x1024）
2. 编写合适的提示词
3. 在管理后台创建新模板
4. 测试生成效果后再启用

**Q: 如何自定义 UI 样式？**

A: 
1. 优先使用 Tailwind CSS 类
2. 自定义样式放在组件的 CSS 模块中
3. 全局样式放在 `app/globals.css`
4. 遵循项目的设计规范

---

## 🚢 部署

### Vercel 部署（推荐）

Vercel 是最简单的部署方式，支持自动构建和部署。

**部署步骤：**

1. **Fork 项目**
   ```bash
   # Fork 本项目到你的 GitHub 账号
   ```

2. **导入到 Vercel**
   - 访问 [Vercel](https://vercel.com)
   - 点击 "New Project"
   - 选择你 Fork 的仓库
   - 点击 "Import"

3. **配置环境变量**
   
   在 Vercel 项目设置中添加以下环境变量：
   
   ```bash
   # Supabase 配置
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # AI 图像生成配置
   IMAGE_API_MODE=chat
   IMAGE_API_BASE_URL=https://api.openai.com
   IMAGE_API_KEY=sk-your-api-key
   IMAGE_CHAT_MODEL=gpt-4o
   IMAGE_IMAGE_MODEL=dall-e-3
   
   # MinIO 配置（如果使用）
   MINIO_ENDPOINT=https://your-minio-endpoint.com
   MINIO_ACCESS_KEY=your-access-key
   MINIO_SECRET_KEY=your-secret-key
   MINIO_BUCKET_NAME=ai-images
   MINIO_USE_SSL=true
   ```

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成（约 2-3 分钟）
   - 访问生成的域名

5. **配置自定义域名（可选）**
   - 在 Vercel 项目设置中添加自定义域名
   - 配置 DNS 记录
   - 等待 SSL 证书自动生成

**Vercel 部署优势：**
- ✅ 自动 CI/CD，推送代码自动部署
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS 证书
- ✅ 免费额度充足
- ✅ Edge Runtime 支持

### 自托管部署

使用 PM2 + Nginx 进行生产部署，适合需要完全控制的场景。

**前置要求：**
- Node.js 18+
- PM2 (`npm install -g pm2`)
- Nginx（可选，用于反向代理）

**部署步骤：**

1. **克隆代码**
```bash
   git clone https://github.com/your-username/ai-wedding.git
   cd ai-wedding
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填写配置
   ```

4. **构建项目**
   ```bash
pnpm build
   ```

5. **启动服务**
   ```bash
   # 使用 PM2 启动
pnpm pm2:start

# 查看状态
pnpm pm2:status
   
   # 查看日志
   pnpm pm2:logs
   ```

6. **配置 Nginx（可选）**
   
   创建 Nginx 配置文件 `/etc/nginx/sites-available/ai-wedding`：
   
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   
   启用配置：
   ```bash
   sudo ln -s /etc/nginx/sites-available/ai-wedding /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

7. **配置 SSL（推荐）**
   ```bash
   # 使用 Let's Encrypt
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

**PM2 常用命令：**
```bash
# 启动
pnpm pm2:start

# 停止
pnpm pm2:stop

# 重启
pnpm pm2:restart

# 查看日志
pnpm pm2:logs

# 查看状态
pnpm pm2:status

# 删除进程
pnpm pm2:delete
```

**自托管优势：**
- ✅ 完全控制服务器
- ✅ 可自定义配置
- ✅ 无第三方依赖
- ✅ 适合企业内网部署

### Docker 部署（即将支持）

Docker 部署方式正在开发中，敬请期待。

**预期功能：**
- 🐳 一键部署
- 📦 包含所有依赖
- 🔄 易于扩展
- 🛠️ 简化运维

详细部署文档请参考 [DEPLOYMENT.md](DEPLOYMENT.md)。

---

## 🤝 贡献指南

我们非常欢迎社区贡献！无论是报告 Bug、提出新功能建议，还是提交代码，都是对项目的巨大帮助。

### 贡献方式

#### 1. 报告 Bug

如果你发现了 Bug，请：

1. 检查 [Issues](https://github.com/your-username/ai-wedding/issues) 是否已有相关报告
2. 如果没有，创建新 Issue，包含：
   - 清晰的标题和描述
   - 复现步骤
   - 预期行为和实际行为
   - 截图或错误日志（如果有）
   - 环境信息（浏览器、操作系统等）

#### 2. 提出新功能

如果你有好的想法，请：

1. 在 [Discussions](https://github.com/your-username/ai-wedding/discussions) 中讨论
2. 说明功能的用途和价值
3. 提供使用场景示例
4. 等待社区反馈

#### 3. 提交代码

**步骤：**

1. **Fork 项目**
   ```bash
   # 在 GitHub 上 Fork 本项目
   git clone https://github.com/your-username/ai-wedding.git
   cd ai-wedding
   ```

2. **创建分支**
   ```bash
   # 从 main 分支创建新分支
   git checkout -b feature/amazing-feature
   # 或
   git checkout -b fix/bug-description
   ```

3. **开发和测试**
   ```bash
   # 安装依赖
   pnpm install
   
   # 开发
   pnpm dev
   
   # 代码检查
   pnpm lint
   
   # 类型检查
   pnpm typecheck
   
   # 构建测试
   pnpm build
   ```

4. **提交更改**
   ```bash
   # 添加文件
   git add .
   
   # 提交（遵循 Conventional Commits 规范）
   git commit -m "feat: add amazing feature"
   ```

5. **推送分支**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **创建 Pull Request**
   - 在 GitHub 上创建 Pull Request
   - 填写 PR 模板
   - 等待代码审查

### 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat:` | 新功能 | `feat: add template preview modal` |
| `fix:` | 修复 Bug | `fix: resolve image upload error` |
| `docs:` | 文档更新 | `docs: update README installation guide` |
| `style:` | 代码格式调整 | `style: format code with prettier` |
| `refactor:` | 代码重构 | `refactor: simplify auth logic` |
| `perf:` | 性能优化 | `perf: optimize image loading` |
| `test:` | 测试相关 | `test: add unit tests for utils` |
| `chore:` | 构建/工具链更新 | `chore: update dependencies` |

**示例：**
```bash
# 好的提交信息
git commit -m "feat: add image comparison slider component"
git commit -m "fix: resolve MinIO 403 error"
git commit -m "docs: add deployment guide"

# 不好的提交信息
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
```

### 代码规范

在提交代码前，请确保：

**✅ 必须遵守：**
- TypeScript 严格模式，禁止使用 `any`
- 通过 ESLint 检查（`pnpm lint`）
- 通过 TypeScript 类型检查（`pnpm typecheck`）
- 能够成功构建（`pnpm build`）
- 单个组件不超过 400 行

**✅ 推荐遵守：**
- 优先使用 Tailwind CSS，避免自定义 CSS
- 组件使用 PascalCase 命名
- Hooks 以 `use` 开头
- 添加必要的注释
- 保持代码简洁易读

**✅ UI 相关：**
- 保持设计一致性
- 确保响应式设计
- 测试不同浏览器兼容性
- 添加必要的加载状态和错误提示

### Pull Request 规范

创建 PR 时，请：

**✅ 必须包含：**
- 清晰的标题（遵循 Conventional Commits）
- 详细的描述（做了什么、为什么、如何测试）
- 关联的 Issue（如 `Closes #123`）
- 截图或录屏（UI 改动必须）

**✅ 确保：**
- 代码通过所有检查
- 没有引入新的 Linter 错误
- 没有冲突
- 分支基于最新的 main 分支

**PR 模板示例：**
```markdown
## 描述
简要描述这个 PR 的目的和改动内容。

## 改动类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化

## 相关 Issue
Closes #123

## 测试
说明如何测试这些改动。

## 截图
如果是 UI 改动，请添加截图。

## 检查清单
- [ ] 代码通过 `pnpm lint`
- [ ] 代码通过 `pnpm typecheck`
- [ ] 代码通过 `pnpm build`
- [ ] 已添加必要的注释
- [ ] 已更新相关文档
```

### 开发环境设置

**推荐工具：**
- **编辑器**: VS Code
- **插件**:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

**VS Code 配置（`.vscode/settings.json`）：**
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### 社区准则

我们致力于营造一个友好、包容的社区环境。请遵守以下准则：

- ✅ 尊重他人，保持礼貌
- ✅ 欢迎不同观点和建议
- ✅ 提供建设性的反馈
- ✅ 帮助新手贡献者
- ❌ 禁止骚扰、歧视、攻击性言论

### 获得帮助

如果你在贡献过程中遇到问题：

1. 查看 [文档](#-文档)
2. 搜索 [Issues](https://github.com/your-username/ai-wedding/issues)
3. 在 [Discussions](https://github.com/your-username/ai-wedding/discussions) 提问
4. 联系维护者

### 贡献者名单

感谢所有为本项目做出贡献的开发者！

<a href="https://github.com/your-username/ai-wedding/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=your-username/ai-wedding" />
</a>

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

**MIT 许可证要点：**
- ✅ 可自由使用、修改、分发
- ✅ 可用于商业项目
- ✅ 需保留版权声明
- ❌ 不提供任何担保

---

## 🙏 致谢

本项目的成功离不开以下优秀的开源项目和服务：

### 核心技术

- [Next.js](https://nextjs.org/) - 强大的 React 全栈框架
- [React](https://react.dev/) - 用户界面库
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集
- [Supabase](https://supabase.com/) - 开源的 Firebase 替代品
- [TailwindCSS](https://tailwindcss.com/) - 实用优先的 CSS 框架

### UI 组件

- [shadcn/ui](https://ui.shadcn.com/) - 精美的 UI 组件库
- [Radix UI](https://www.radix-ui.com/) - 无样式的可访问组件
- [Lucide Icons](https://lucide.dev/) - 精美的图标库
- [GSAP](https://greensock.com/gsap/) - 专业的动画库
- [Framer Motion](https://www.framer.com/motion/) - React 动画库

### AI 服务

- [OpenAI](https://openai.com/) - AI 图像生成和识别
- [Google Gemini](https://deepmind.google/technologies/gemini/) - 多模态 AI 模型
- [302.AI](https://302.ai/) - AI API 聚合服务

### 开发工具

- [Vercel](https://vercel.com/) - 部署和托管平台
- [MinIO](https://min.io/) - 高性能对象存储
- [PM2](https://pm2.keymetrics.io/) - Node.js 进程管理器
- [ESLint](https://eslint.org/) - JavaScript 代码检查工具
- [Prettier](https://prettier.io/) - 代码格式化工具

### 资源

- [Pexels](https://www.pexels.com/) - 免费高质量图片素材
- [Unsplash](https://unsplash.com/) - 免费摄影图片
- [Flaticon](https://www.flaticon.com/) - 免费图标资源

---

## 🌟 项目统计

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/your-username/ai-wedding?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/ai-wedding?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/your-username/ai-wedding?style=social)

![GitHub issues](https://img.shields.io/github/issues/your-username/ai-wedding)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-username/ai-wedding)
![GitHub last commit](https://img.shields.io/github/last-commit/your-username/ai-wedding)
![GitHub contributors](https://img.shields.io/github/contributors/your-username/ai-wedding)

</div>

---

## 📞 联系方式

我们很乐意听到你的反馈和建议！

### 获取帮助

- 📖 **文档**: 查看 [docs/](docs/) 目录中的详细文档
- 💬 **讨论**: 在 [Discussions](https://github.com/your-username/ai-wedding/discussions) 提问和交流
- 🐛 **Bug 报告**: 在 [Issues](https://github.com/your-username/ai-wedding/issues) 报告问题
- 💡 **功能建议**: 在 [Issues](https://github.com/your-username/ai-wedding/issues) 提出新功能建议

### 社交媒体

- 🌐 **项目主页**: [GitHub](https://github.com/your-username/ai-wedding)
- 📧 **邮件**: your-email@example.com
- 💬 **微信群**: 扫描下方二维码加入交流群
- 🐦 **Twitter**: [@your-twitter](https://twitter.com/your-twitter)

### 商务合作

如果你对本项目感兴趣，想要：
- 🤝 商业合作
- 💼 定制开发
- 🎓 技术咨询
- 📚 技术培训

请通过邮件联系我们：business@example.com

---

## 🗺️ 路线图

我们计划在未来版本中添加以下功能：

### v2.0（计划中）
- [ ] 🎨 更多模板（50+ 场景）
- [ ] 🤖 AI 智能推荐模板
- [ ] 📱 移动端原生 App
- [ ] 🌍 多语言支持（英文、日文、韩文）
- [ ] 💳 更多支付方式
- [ ] 🎁 会员订阅系统

### v2.1（规划中）
- [ ] 🖼️ 批量生成优化
- [ ] 🎬 视频生成功能
- [ ] 🎨 图片编辑器
- [ ] 👥 团队协作功能
- [ ] 📊 高级数据分析
- [ ] 🔌 API 开放平台

### v3.0（远期规划）
- [ ] 🧠 自定义 AI 模型训练
- [ ] 🎭 人物风格迁移
- [ ] 🌈 高级图片编辑
- [ ] 🏪 模板市场
- [ ] 💰 创作者收益分成
- [ ] 🌐 去中心化存储

想要参与功能讨论？请访问 [Discussions](https://github.com/your-username/ai-wedding/discussions)。

---

## 📊 性能指标

本项目在性能和用户体验方面的表现：

- ⚡ **首屏加载**: < 2s
- 🚀 **页面切换**: < 500ms
- 🎨 **图片生成**: 2-5 分钟
- 📱 **移动端适配**: 100%
- ♿ **可访问性**: WCAG 2.1 AA
- 🔒 **安全性**: A+ 评级

---

## 🎓 学习资源

如果你想学习本项目使用的技术栈，推荐以下资源：

### Next.js
- [Next.js 官方文档](https://nextjs.org/docs)
- [Next.js 中文文档](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### React
- [React 官方文档](https://react.dev/)
- [React 中文文档](https://zh-hans.react.dev/)

### TypeScript
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript 中文文档](https://www.tslang.cn/docs/home.html)

### Supabase
- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase 中文教程](https://supabase.com/docs)

### TailwindCSS
- [TailwindCSS 官方文档](https://tailwindcss.com/docs)
- [TailwindCSS 中文文档](https://www.tailwindcss.cn/docs)

---

## 💖 支持项目

如果这个项目对你有帮助，可以通过以下方式支持我们：

### 免费支持
- ⭐ 给项目一个 Star
- 🔀 Fork 项目并贡献代码
- 📢 分享项目给更多人
- 📝 撰写使用教程或博客
- 🐛 报告 Bug 和提出建议

### 赞助支持
- ☕ [请我喝杯咖啡](https://buymeacoffee.com/your-username)
- 💰 [成为赞助者](https://github.com/sponsors/your-username)
- 🎁 [爱发电支持](https://afdian.net/@your-username)

你的支持是我们持续改进的动力！

---

<div align="center">

## ⭐ Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/ai-wedding&type=Date)](https://star-history.com/#your-username/ai-wedding&Date)

---

**如果这个项目对你有帮助，请给一个 ⭐️ Star 支持一下！**

Made with ❤️ by [AI Wedding Team](https://github.com/your-username)

[⬆ 回到顶部](#ai-婚纱照生成平台-)

---

Copyright © 2025 AI Wedding. All rights reserved.

</div>
