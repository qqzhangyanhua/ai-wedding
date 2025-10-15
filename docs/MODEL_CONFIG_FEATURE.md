# 模型配置管理功能

## 功能概述

本功能允许管理员通过后台界面动态管理 AI 模型的 API 配置，无需修改环境变量和重启服务。

## 功能特性

- ✅ 数据库存储配置，支持多套配置管理
- ✅ 管理员后台可视化管理界面
- ✅ 配置激活/停用切换（同类型只能有一个激活配置）
- ✅ API Key 脱敏显示，保护敏感信息
- ✅ 配置优先级：数据库配置 > 环境变量（回退机制）
- ✅ 支持多种配置类型（当前支持 `generate-image`）

## 数据库结构

### 表：`model_configs`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| type | TEXT | 配置类型（如 `generate-image`） |
| name | TEXT | 配置名称 |
| api_base_url | TEXT | API 基础 URL |
| api_key | TEXT | API 密钥（敏感） |
| model_name | TEXT | 模型名称 |
| status | TEXT | 状态（`active` 或 `inactive`） |
| description | TEXT | 配置描述（可选） |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |
| created_by | UUID | 创建者 |

### 约束和触发器

1. **唯一性约束**：同一 `type` 只能有一个 `active` 状态的配置
2. **自动更新触发器**：激活配置时，自动停用同类型的其他配置
3. **RLS 策略**：仅管理员可以管理配置，认证用户可以读取激活配置

## 使用指南

### 1. 数据库迁移

首先，在 Supabase 中执行数据库迁移文件：

```bash
# 文件位置
database-migrations/2025-10-15-create-model-configs.sql
```

在 Supabase Dashboard 的 SQL Editor 中执行该文件的内容。

### 2. 访问管理页面

管理员登录后，访问：

```
http://your-domain/admin/model-configs
```

### 3. 创建配置

1. 点击「新建配置」按钮
2. 填写表单：
   - **配置类型**：选择 `generate-image`
   - **配置名称**：如「默认图片生成配置」
   - **API Base URL**：如 `https://api.aioec.tech`
   - **API Key**：输入完整的 API 密钥
   - **模型名称**：如 `gemini-2.5-flash-image`
   - **状态**：选择 `active` 或 `inactive`
   - **描述**：可选的配置说明
3. 点击「创建」

### 4. 管理配置

- **编辑**：点击配置卡片右侧的编辑图标
- **删除**：点击删除图标（需确认）
- **激活/停用**：点击电源图标切换状态
- **查看 API Key**：显示脱敏的 API Key（如 `sk-123...def`）

### 5. 配置生效

当存在激活的配置时，`/api/generate-stream` 会自动使用数据库配置：

```
优先级：激活的数据库配置 > 环境变量
```

如果没有激活配置，系统会回退到环境变量：
- `IMAGE_API_BASE_URL`
- `IMAGE_API_KEY`
- `IMAGE_CHAT_MODEL`

## API 接口

### 管理员接口（需要管理员权限）

#### 获取配置列表
```
GET /api/admin/model-configs
Authorization: Bearer <token>
```

#### 创建配置
```
POST /api/admin/model-configs
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "generate-image",
  "name": "配置名称",
  "api_base_url": "https://api.example.com",
  "api_key": "sk-...",
  "model_name": "model-name",
  "status": "active",
  "description": "可选描述"
}
```

#### 更新配置
```
PATCH /api/admin/model-configs/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "inactive"
}
```

#### 删除配置
```
DELETE /api/admin/model-configs/{id}
Authorization: Bearer <token>
```

#### 获取配置详情（包含完整 API Key）
```
GET /api/admin/model-configs/{id}
Authorization: Bearer <token>
```

### 公共接口（需要认证）

#### 获取激活配置
```
GET /api/model-configs/active?type=generate-image
Authorization: Bearer <token>
```

## 安全考虑

1. **API Key 保护**
   - 列表接口返回脱敏的 API Key
   - 只有详情接口返回完整 API Key（用于编辑）
   - 前端不存储完整 API Key

2. **权限控制**
   - 只有管理员可以管理配置
   - 普通用户只能读取激活配置（通过 RLS 策略）

3. **数据库安全**
   - 启用 RLS（行级安全）
   - API Key 存储在数据库中（建议后续加密）

## 扩展建议

### 短期优化

1. **配置验证**：添加「测试连接」功能，验证 API 配置是否正常
2. **配置历史**：记录配置变更历史
3. **批量操作**：支持批量导入/导出配置

### 长期优化

1. **API Key 加密**：使用 Supabase Vault 或其他加密方案存储 API Key
2. **配置版本控制**：支持配置回滚
3. **多环境支持**：区分开发/测试/生产环境配置
4. **配置模板**：预设常用配置模板

## 故障排查

### 问题：配置不生效

**检查步骤**：
1. 确认配置状态为 `active`
2. 查看 `/api/generate-stream` 日志，确认使用了哪个配置源
3. 检查数据库 RLS 策略是否正确

### 问题：无法访问管理页面

**检查步骤**：
1. 确认当前用户是管理员（`profiles.role = 'admin'`）
2. 检查 Supabase RLS 策略是否正确配置

### 问题：API Key 显示为 ***

**说明**：
- 这是正常的脱敏显示
- 点击「编辑」可以查看和修改完整的 API Key

## 文件清单

### 数据库
- `database-migrations/2025-10-15-create-model-configs.sql` - 数据库迁移文件

### 类型定义
- `app/types/model-config.ts` - TypeScript 类型定义

### API 路由
- `app/api/admin/model-configs/route.ts` - 配置列表和创建
- `app/api/admin/model-configs/[id]/route.ts` - 配置详情、更新和删除
- `app/api/model-configs/active/route.ts` - 获取激活配置

### 前端页面和组件
- `app/admin/model-configs/page.tsx` - 管理页面
- `app/components/admin/ModelConfigList.tsx` - 配置列表组件
- `app/components/admin/ModelConfigForm.tsx` - 配置表单组件

### 业务逻辑
- `app/api/generate-stream/route.ts` - 修改后的图片生成接口（使用数据库配置）

## 总结

该功能实现了完整的模型配置管理系统，允许管理员通过可视化界面动态管理 AI 模型配置，提高了系统的灵活性和可维护性。

