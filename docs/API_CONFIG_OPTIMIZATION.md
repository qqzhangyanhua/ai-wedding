# API 配置优化 - 使用数据库配置

## 📋 优化概述

将"生成单张"功能从硬编码的 API 配置改为使用数据库配置，与 `/create` 页面保持一致。

## 🔄 变更内容

### 之前的实现（硬编码）

```typescript
// ❌ 硬编码 API 配置
const response = await fetch(
  "https:/xxxxxcn/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer sk-j8zpY3VAxfOpxavrzVg2jSSQsLGI4coTZbfMZsIGTEnKmxcV",
    },
    body: JSON.stringify(requestData),
  }
);
```

### 现在的实现（使用配置）

```typescript
// ✅ 使用 /api/generate-stream 接口
// 从 Supabase 获取认证 token
const { data: { session } } = await supabase.auth.getSession();
if (!session?.access_token) {
  throw new Error('未登录，请先登录');
}

// 调用统一的 API 接口
const response = await fetch('/api/generate-stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({
    prompt: enhancedPrompt,
    image_inputs: [originalImage],
    model: 'gemini-2.5-flash-image',
  }),
});
```

## 🎯 优势

### 1. 配置统一管理

#### 数据库配置优先
- 从 `model_configs` 表读取激活的配置
- 支持动态切换不同的 API 提供商
- 无需重新部署即可更新配置

#### 环境变量回退
- 如果数据库没有配置，使用环境变量
- 确保系统的可用性和灵活性

### 2. 安全性提升

#### API 密钥保护
- ✅ API 密钥存储在服务端（数据库或环境变量）
- ✅ 客户端无法访问 API 密钥
- ✅ 通过 Supabase 认证保护 API 调用

#### 之前的问题
- ❌ API 密钥硬编码在客户端代码
- ❌ 任何人都可以查看源代码获取密钥
- ❌ 密钥泄露风险高

### 3. 功能一致性

#### 与 /create 页面保持一致
- 使用相同的 API 接口 `/api/generate-stream`
- 使用相同的配置管理方式
- 使用相同的提示词增强逻辑

#### 代码复用
- 共享相同的 API 路由
- 共享相同的错误处理
- 共享相同的流式响应处理

### 4. 可维护性

#### 集中管理
- 所有图片生成都通过 `/api/generate-stream`
- 修改 API 配置只需更新一处
- 便于监控和日志记录

#### 扩展性
- 支持添加更多 AI 模型
- 支持 A/B 测试不同配置
- 支持按用户分配不同配置

## 🔧 技术实现

### API 配置获取流程

```typescript
// 1. 从数据库查询激活的配置
const dbConfig = await getActiveModelConfig(supabase);

// 2. 确定使用的配置
if (dbConfig) {
  // 使用数据库配置
  IMAGE_API_BASE_URL = dbConfig.api_base_url;
  IMAGE_API_KEY = dbConfig.api_key;
  IMAGE_CHAT_MODEL = dbConfig.model_name;
} else {
  // 回退到环境变量
  IMAGE_API_BASE_URL = ENV_IMAGE_API_BASE_URL;
  IMAGE_API_KEY = ENV_IMAGE_API_KEY;
  IMAGE_CHAT_MODEL = ENV_IMAGE_CHAT_MODEL;
}
```

### 数据库表结构

```sql
-- model_configs 表
CREATE TABLE model_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'generate-image', 'identify-image', etc.
  api_base_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'inactive'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 查询激活配置
SELECT * FROM model_configs 
WHERE type = 'generate-image' 
  AND status = 'active' 
LIMIT 1;
```

### 环境变量配置

```bash
# .env 文件
IMAGE_API_BASE_URL=https://api.aioec.tech
IMAGE_API_KEY=your-api-key-here
IMAGE_CHAT_MODEL=gemini-2.5-flash-image
```

## 📊 配置优先级

1. **数据库配置**（最高优先级）
   - 从 `model_configs` 表读取
   - `type = 'generate-image'` 且 `status = 'active'`
   - 支持动态更新

2. **环境变量**（回退方案）
   - `IMAGE_API_BASE_URL`
   - `IMAGE_API_KEY`
   - `IMAGE_CHAT_MODEL`

3. **默认值**（最后的回退）
   - `IMAGE_API_BASE_URL`: `https://api.aioec.tech`
   - `IMAGE_CHAT_MODEL`: `gemini-2.5-flash-image`

## 🔒 安全措施

### 1. 认证检查
```typescript
// 验证用户登录状态
const { data: { session } } = await supabase.auth.getSession();
if (!session?.access_token) {
  throw new Error('未登录，请先登录');
}

// 使用 token 调用 API
headers: {
  'Authorization': `Bearer ${session.access_token}`,
}
```

### 2. 速率限制
```typescript
// 每个用户每分钟最多 5 次请求
const RL_WINDOW_MS = 60 * 1000;
const RL_LIMIT = 5;
```

### 3. 输入验证
```typescript
// 使用 Zod 验证输入
const validation = validateData(GenerateImageSchema, body);
if (!validation.success) {
  return new Response(
    JSON.stringify({ error: validation.error }),
    { status: 400 }
  );
}
```

## 🎨 提示词处理

### 五官保持强度

根据用户选择的五官保持强度，动态构建提示词：

```typescript
// 高强度 - 严格保持
if (settings.facePreservation === 'high') {
  enhancedPrompt = `Please edit the provided original image based on the following guidelines:

STRICT REQUIREMENTS:
1. ABSOLUTELY preserve all facial features...
2. Maintain the person's basic facial structure...
...

SPECIFIC EDITING REQUEST: ${basePrompt}

Please focus your modifications ONLY on the user's specific requirements...`;
}

// 中等强度 - 保持主要特征
else if (settings.facePreservation === 'medium') {
  // 类似但要求稍宽松
}

// 低强度 - 允许调整
else {
  // 直接使用原始提示词
  enhancedPrompt = basePrompt;
}
```

### API 端的提示词包裹

`/api/generate-stream` 会自动检测提示词是否已包含模板：

```typescript
function composePrompt(userPrompt: string): string {
  // 如果已包含模板关键字，直接返回
  const hasTemplate = /STRICT REQUIREMENTS|Please edit the provided original image/i.test(userPrompt);
  if (hasTemplate) return userPrompt;
  
  // 否则包裹标准模板
  return `${INTRO}\n\n${FACE_PRESERVATION}\n\nSPECIFIC EDITING REQUEST: ${userPrompt}\n\n${CLOSING}`;
}
```

## 📝 代码变更清单

### 修改的文件
- ✅ `app/components/GenerateSinglePage.tsx`
  - 移除硬编码的 API URL 和密钥
  - 添加 Supabase 认证
  - 调用 `/api/generate-stream` 接口
  - 保持提示词增强逻辑

### 使用的现有文件
- ✅ `app/api/generate-stream/route.ts` - API 路由
- ✅ `app/lib/supabase.ts` - Supabase 客户端
- ✅ `app/types/model-config.ts` - 配置类型定义

## 🧪 测试验证

### 功能测试
- ✅ 使用数据库配置生成图片
- ✅ 数据库无配置时使用环境变量
- ✅ 未登录用户提示登录
- ✅ 流式响应正常工作
- ✅ 错误处理正确

### 安全测试
- ✅ 客户端代码不包含 API 密钥
- ✅ 认证失败时拒绝请求
- ✅ 速率限制正常工作

### 兼容性测试
- ✅ 与 /create 页面行为一致
- ✅ 支持所有提示词格式
- ✅ 支持所有五官保持强度

## 🚀 部署注意事项

### 1. 环境变量配置

确保设置以下环境变量（作为回退）：

```bash
IMAGE_API_BASE_URL=https://api.aioec.tech
IMAGE_API_KEY=your-secret-key
IMAGE_CHAT_MODEL=gemini-2.5-flash-image
```

### 2. 数据库配置

在 `model_configs` 表中添加激活配置：

```sql
INSERT INTO model_configs (
  name,
  type,
  api_base_url,
  api_key,
  model_name,
  status
) VALUES (
  'Gemini Flash Image',
  'generate-image',
  'https://api.aioec.tech',
  'your-secret-key',
  'gemini-2.5-flash-image',
  'active'
);
```

### 3. 权限配置

确保 API 路由有正确的权限：
- 需要用户认证
- 速率限制已启用
- 输入验证已启用

## 📊 监控建议

### 1. 日志记录
- API 调用次数
- 成功/失败率
- 响应时间
- 错误类型

### 2. 配置监控
- 当前使用的配置来源（数据库/环境变量）
- 配置切换记录
- API 密钥有效性

### 3. 用户行为
- 生成请求频率
- 常用的提示词
- 失败原因分析

## ✨ 总结

### 改进效果
1. **安全性** ⬆️⬆️⬆️ - API 密钥不再暴露在客户端
2. **可维护性** ⬆️⬆️ - 配置集中管理，易于更新
3. **一致性** ⬆️⬆️ - 与 /create 页面保持一致
4. **灵活性** ⬆️⬆️ - 支持动态切换配置

### 代码质量
- ✅ TypeScript 类型检查通过
- ✅ ESLint 代码质量检查通过
- ✅ 无安全漏洞
- ✅ 代码结构清晰

### 用户体验
- ✅ 功能保持不变
- ✅ 性能无影响
- ✅ 错误提示更友好
- ✅ 认证流程顺畅

这次优化成功将"生成单张"功能从硬编码配置迁移到了统一的配置管理系统，大大提升了安全性和可维护性！🎉

