# AI 提示词生成功能文档

## 功能概述

AI 提示词生成功能允许用户上传一张婚纱照参考图片，系统会使用 AI 分析图片风格，并生成 5 个中英对照的专业提示词。用户可以选择任意一个提示词，在新窗口中跳转到图片生成页面进行创作。

## 使用场景

当用户在模板库中找不到合适的婚纱照风格时，可以：
1. 上传一张喜欢的婚纱照参考图片
2. AI 分析图片风格并生成 5 个提示词
3. 选择最喜欢的提示词
4. 自动跳转到生成页面，提示词已预填充
5. 上传自己的照片，生成同风格的婚纱照

## 技术实现

### 1. 数据库层

#### model_configs 表更新
- 新增 `'generate-prompts'` 类型
- 支持配置专门用于提示词生成的 AI 模型
- 默认 source 为 `'openAi'`

```sql
-- 迁移文件: database-migrations/2025-11-06-add-generate-prompts-type.sql
ALTER TABLE public.model_configs 
ADD CONSTRAINT model_configs_type_check 
CHECK (type = ANY (ARRAY['generate-image'::text, 'identify-image'::text, 'generate-prompts'::text, 'other'::text]));
```

### 2. 类型定义

#### app/types/model-config.ts
```typescript
export type ModelConfigType = 'generate-image' | 'identify-image' | 'generate-prompts' | 'other';
```

#### app/types/prompt.ts
```typescript
export interface PromptItem {
  chinese: string;  // 中文提示词
  english: string;  // 英文提示词
  index: number;    // 提示词索引
}

export interface PromptsResponse {
  success: boolean;
  prompts: PromptItem[];
  error?: string;
}
```

### 3. 后端 API

#### POST /api/generate-prompts

**请求参数：**
```json
{
  "imageBase64": "data:image/jpeg;base64,..."
}
```

**响应格式：**
```json
{
  "success": true,
  "prompts": [
    {
      "index": 1,
      "chinese": "保持原照片人物五官特征，在巴黎铁塔前拍摄浪漫婚纱照",
      "english": "Maintain original facial features, romantic wedding photo in front of Eiffel Tower in Paris..."
    },
    ...
  ]
}
```

**实现要点：**
- 从数据库获取 `type='generate-prompts'` 且 `status='active'` 的模型配置
- 使用 OpenAI 兼容 API 调用视觉模型
- 要求模型返回 JSON 格式的 5 个提示词
- 每个提示词都强调保持人物五官特征

### 4. 前端实现

#### Hook: usePromptGeneration
- `generatePrompts(imageBase64)` - 调用 API 生成提示词
- `isGenerating` - 加载状态
- `prompts` - 生成的提示词列表
- `error` - 错误信息
- `clearPrompts()` - 清空提示词

#### 页面: /generate-prompts
- 图片上传区域（支持拖拽、点击上传）
- 实时预览上传的图片
- 生成提示词按钮
- 5 个提示词卡片展示（中英对照）
- 每个提示词有"使用"按钮

#### 页面: /generate-single
- 支持 URL 参数 `?prompt=xxx`
- 自动填充提示词到自定义输入框
- 显示成功提示

#### 首页入口
- 新增"AI生成提示词"按钮
- 紫色渐变背景，带"NEW"标签
- 更新"如何使用"步骤说明

## 用户流程

```
1. 用户在首页点击"AI生成提示词"
   ↓
2. 进入 /generate-prompts 页面
   ↓
3. 上传参考图片（拖拽或点击）
   ↓
4. 点击"生成提示词"按钮
   ↓
5. AI 分析图片，生成 5 个提示词
   ↓
6. 用户浏览提示词（中英对照）
   ↓
7. 点击某个提示词的"使用"按钮
   ↓
8. 新窗口打开 /generate-single?prompt=xxx
   ↓
9. 提示词自动填充
   ↓
10. 用户上传自己的照片
    ↓
11. 生成同风格的婚纱照
```

## 配置要求

### 数据库配置

需要在 `model_configs` 表中添加一条记录：

```sql
INSERT INTO public.model_configs (
  type,
  name,
  api_base_url,
  api_key,
  model_name,
  status,
  source,
  description
) VALUES (
  'generate-prompts',
  'OpenAI GPT-4o 提示词生成',
  'https://api.openai.com',
  'sk-your-api-key-here',
  'gpt-4o',
  'active',
  'openAi',
  '用于分析图片并生成婚纱照提示词'
);
```

### 推荐模型

- **OpenAI**: `gpt-4o` 或 `gpt-4-turbo` (支持视觉分析)
- **其他兼容 API**: 任何支持 OpenAI 格式的视觉模型

## 注意事项

1. **图片大小限制**: 最大 10MB
2. **图片格式**: 支持 JPG、PNG 等常见格式
3. **Base64 传输**: 图片直接转换为 base64 传输，不保存到服务器
4. **认证要求**: 需要用户登录才能使用
5. **提示词质量**: 依赖于配置的 AI 模型能力
6. **新窗口打开**: 使用提示词时会在新标签页打开生成页面

## 文件清单

### 新增文件
- `app/types/prompt.ts` - 提示词类型定义
- `app/api/generate-prompts/route.ts` - 提示词生成 API
- `app/hooks/usePromptGeneration.ts` - 提示词生成 Hook
- `app/components/GeneratePromptsPage.tsx` - 提示词生成页面组件
- `app/generate-prompts/page.tsx` - 提示词生成页面
- `database-migrations/2025-11-06-add-generate-prompts-type.sql` - 数据库迁移文件

### 修改文件
- `init.sql` - 更新 model_configs 表约束
- `app/types/model-config.ts` - 添加新类型
- `app/components/GenerateSinglePage.tsx` - 支持 URL 参数
- `app/components/HomePage.tsx` - 添加入口按钮

## 未来优化方向

1. **提示词收藏**: 允许用户收藏喜欢的提示词
2. **提示词编辑**: 允许用户微调生成的提示词
3. **历史记录**: 保存用户生成过的提示词
4. **批量生成**: 一次上传多张图片，批量生成提示词
5. **风格标签**: 自动识别并标注图片风格类型
6. **提示词评分**: 用户可以对提示词质量进行评分

## 测试建议

1. **功能测试**:
   - 上传不同风格的婚纱照
   - 验证生成的提示词准确性
   - 测试提示词跳转功能

2. **边界测试**:
   - 上传非婚纱照图片
   - 上传过大的图片
   - 测试未登录状态

3. **性能测试**:
   - 测试 API 响应时间
   - 测试并发请求处理

## 支持与反馈

如有问题或建议，请联系开发团队。

