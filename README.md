# AI 婚纱照生成平台 🎨

<div align="center">

基于 AI 技术的智能婚纱照生成平台，上传照片，选择模板，AI 自动生成专业婚纱照。

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8)](https://tailwindcss.com/)

[功能特性](#-核心功能) | [快速开始](#-快速开始) | [文档](#-文档)

</div>

---

## 📖 项目简介

通过 AI 图像生成技术，让用户上传照片并选择场景模板（巴黎、东京、冰岛等），快速生成专业级婚纱照。

### ✨ 核心特性

- 💡 **AI 图像生成**：支持 DALL-E 3 / Gemini 2.5 等多种模型
- 🎯 **人物识别**：自动检测上传照片是否包含人物
- 🔧 **动态配置**：管理员可动态切换 AI 模型，无需重启
- 🎨 **模板系统**：10+ 精美场景模板，支持自定义提示词
- 🌐 **画廊分享**：作品分享、点赞、收藏功能
- 💰 **积分系统**：积分购买、邀请奖励机制

### 🎯 核心功能

#### 用户端
- 🖼️ **照片生成**：上传照片 → 选择模板 → AI 自动生成
- 🔍 **智能识别**：自动验证照片是否包含人物
- 📊 **项目管理**：查看生成历史、编辑删除项目
- 🌐 **画廊浏览**：浏览公开作品、点赞收藏
- 💰 **积分管理**：购买积分、邀请好友获得奖励

#### 管理员
- 🛠️ **模板管理**：创建/编辑模板、配置提示词
- ⚙️ **模型配置**：动态切换 AI 模型（图片生成、图片识别）
- 📈 **数据统计**：用户活跃度、生成量、收入分析

### 🏗️ 技术栈

**前端**: Next.js 14 + TypeScript + TailwindCSS  
**后端**: Supabase (PostgreSQL) + MinIO 存储  
**AI**: OpenAI / Gemini / 兼容 API

---

## 🚀 快速开始

### 前置要求

- Node.js 18+
- pnpm
- Supabase 账号
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

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# MinIO 存储（可选）
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=ai-images
MINIO_USE_SSL=false
```

### 4️⃣ 初始化数据库

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 执行 init.sql 文件内容即可完成所有表结构、触发器、示例数据的初始化
```

将 `init.sql` 文件的内容粘贴到 SQL Editor 中执行。

### 5️⃣ 设置管理员权限

在 Supabase SQL Editor 中执行：

```sql
-- 通过邮箱设置管理员权限
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';

-- 验证设置是否成功
SELECT id, email, role, created_at 
FROM profiles 
WHERE role = 'admin';
```

### 6️⃣ 配置 AI 模型

启动服务后，访问管理后台配置 AI 模型。

#### 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

#### 添加图片生成配置

1. 使用管理员账号登录
2. 访问 [http://localhost:3000/admin/model-configs](http://localhost:3000/admin/model-configs)
3. 点击"新建配置"

**配置示例（OpenAI DALL-E 3）：**
```
配置名称：默认图片生成配置
用途类型：图片生成 (image-generation)
API Base URL：https://api.openai.com
API Key：sk-your-openai-api-key
模型名称：dall-e-3
状态：激活 ✅
```

**配置示例（302.AI / Gemini）：**
```
配置名称：Gemini 图片生成
用途类型：图片生成 (image-generation)
API Base URL：https://api.302.ai/v1
API Key：sk-your-302ai-key
模型名称：gemini-2.0-flash-exp
状态：激活 ✅
```

#### 添加图片识别配置

```
配置名称：人物识别配置
用途类型：图片识别 (identify-image)
API Base URL：https://api.openai.com
API Key：sk-your-openai-api-key
模型名称：gpt-4o-mini
状态：激活 ✅
```

### 7️⃣ 创建模板（可选）

系统已包含 10 个示例模板，可直接使用。如需自定义：

1. 访问 [http://localhost:3000/admin/templates](http://localhost:3000/admin/templates)
2. 点击"新建模板"
3. 填写信息并上传预览图
4. 配置提示词列表

**提示词示例：**
```json
[
  {
    "prompt": "A romantic wedding photo in front of the Eiffel Tower in Paris, elegant white wedding dress, handsome groom in black suit, golden hour lighting, professional photography, high quality, 8K resolution",
    "weight": 1
  }
]
```

### 8️⃣ 测试功能

✅ 注册登录  
✅ 上传照片（测试人物识别）  
✅ 创建项目并生成图片  
✅ 查看结果  
✅ 管理后台功能

---

## 📱 使用指南

### 用户端流程

1. **注册登录**：邮箱注册或 Google OAuth
2. **创建项目**：上传照片 → 选择模板 → 开始生成
3. **查看结果**：查看生成的图片、下载、分享
4. **画廊浏览**：浏览其他用户作品、点赞收藏

### 管理员配置

#### 必做配置清单

| 配置项 | 位置 | 说明 |
|--------|------|------|
| ✅ 设置管理员权限 | Supabase `profiles` 表 | `role = 'admin'` |
| ✅ 配置图片生成模型 | `/admin/model-configs` | `image-generation` 类型 |
| ✅ 配置图片识别模型 | `/admin/model-configs` | `identify-image` 类型 |
| ✅ 检查模板 | `/admin/templates` | 已有 10 个示例模板 |

#### 模板管理

- 创建/编辑模板
- 上传预览图
- 配置提示词列表（支持多个提示词随机选择）
- 设置排序和启用状态

#### 模型配置

- 支持多个模型配置
- 每种用途类型只能有一个激活配置
- 切换模型无需重启服务
- API Key 加密存储

---

## 📂 项目结构

```
ai-wedding/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── generate-image/       # 图片生成
│   │   ├── identify-image/       # 图片识别
│   │   ├── upload-image/         # 图片上传
│   │   ├── gallery/              # 画廊 API
│   │   └── admin/                # 管理员 API
│   ├── components/               # React 组件
│   │   ├── admin/                # 管理员组件
│   │   └── ui/                   # UI 基础组件
│   ├── hooks/                    # 自定义 Hooks
│   ├── lib/                      # 工具函数
│   ├── types/                    # TypeScript 类型
│   └── page.tsx                  # 页面入口
├── docs/                         # 项目文档
├── init.sql                      # 数据库初始化脚本
├── package.json                  # 项目依赖
└── .env.example                  # 环境变量模板
```

---

## 🗺️ 路由参考

### 用户端页面

```
GET  /                    - 首页
GET  /templates           - 模板浏览
GET  /gallery             - 作品画廊
GET  /pricing             - 价格页面
GET  /create              - 创建项目（需登录）
GET  /dashboard           - 用户仪表盘（需登录）
GET  /results/[id]        - 项目结果（需登录）
```

### 管理员页面

```
GET  /admin/templates           - 模板管理（需管理员）
GET  /admin/templates/new       - 创建模板（需管理员）
GET  /admin/templates/[id]      - 编辑模板（需管理员）
GET  /admin/model-configs       - 模型配置（需管理员）
```

### API 路由

```
# 图片处理
POST /api/generate-image        - 图片生成
POST /api/identify-image        - 人物检测
POST /api/upload-image          - 照片上传

# 用户功能
GET  /api/templates             - 获取模板
GET  /api/gallery               - 获取画廊作品

# 管理员 API（需 Authorization Header）
GET    /api/admin/templates              - 管理模板
POST   /api/admin/templates              - 创建模板
PUT    /api/admin/templates/[id]         - 更新模板
DELETE /api/admin/templates/[id]         - 删除模板
GET    /api/admin/model-configs          - 管理配置
POST   /api/admin/model-configs          - 创建配置
PUT    /api/admin/model-configs/[id]     - 更新配置
```

---

## 🛠️ 开发指南

### 常用命令

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 启动生产服务
pnpm start

# 代码检查
pnpm lint

# PM2 部署
pnpm pm2:start          # 启动
pnpm pm2:stop           # 停止
pnpm pm2:restart        # 重启
pnpm pm2:logs           # 查看日志
```

### 代码规范

- **TypeScript**: 严格模式，禁止 `any`
- **组件**: 单个组件不超过 400 行
- **样式**: 优先使用 Tailwind CSS

### 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥 | - |
| `MINIO_ENDPOINT` | MinIO 端点 | - |
| `MINIO_ACCESS_KEY` | MinIO 访问密钥 | - |
| `MINIO_SECRET_KEY` | MinIO 密钥 | - |

---

## 📚 文档

### 功能文档

- [模型配置管理](docs/MODEL_CONFIG_FEATURE.md) - 动态配置 AI 模型
- [图片识别功能](docs/IMAGE_IDENTIFICATION_FEATURE.md) - 人物检测与验证
- [画廊分享功能](GALLERY_FEATURE_SUMMARY.md) - 作品分享系统
- [提示词优化](docs/prompt-optimization-v3-success-case.md) - 提高生成质量

### 开发文档

- [调试指南](docs/DEBUG_GUIDE.md) - 问题排查
- [MinIO 配置](docs/MINIO_403_FIX.md) - 对象存储配置

---

## 🔧 常见问题

### Q: 上传照片提示"未检测到人物"？

A: 确保照片中有清晰的人物面部，光线充足，不模糊。

### Q: 如何切换 AI 模型？

A: 进入 `/admin/model-configs`，创建新配置并点击"激活"。

### Q: MinIO 出现 403 错误？

A: 运行 `pnpm fix-minio` 或参考 [MinIO 配置文档](docs/MINIO_403_FIX.md)。

---

## 🚢 部署

### Vercel 部署（推荐）

1. Fork 项目到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 点击 Deploy

### 自托管部署

```bash
# 构建
pnpm build

# 使用 PM2 启动
pnpm pm2:start
```

详见 [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📄 许可证

MIT License - 可自由使用、修改、分发

---

## 📞 联系方式

<div align="center">

<img src="docs/wechat-qrcode.jpg" alt="微信二维码" width="300"/>

**扫码添加微信**

</div>

- 🐛 **Bug 报告**: [Issues](https://github.com/your-username/ai-wedding/issues)
- 💡 **功能建议**: [Issues](https://github.com/your-username/ai-wedding/issues)
- 💬 **讨论交流**: [Discussions](https://github.com/your-username/ai-wedding/discussions)

---

## 💖 支持项目

- ⭐ Star 本项目
- 🔀 Fork 并贡献代码
- 📢 分享给更多人

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star！**

Made with ❤️ by [AI Wedding Team](https://github.com/your-username)

Copyright © 2025 AI Wedding. All rights reserved.

</div>
