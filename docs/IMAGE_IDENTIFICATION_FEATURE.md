# 图片识别功能

## 功能概述

在用户上传照片并点击「生成婚纱照」时，系统会自动调用 AI 模型验证上传的照片是否包含人物。如果检测到不包含人物的照片，会提示用户重新上传，确保生成质量。

## 功能特性

- ✅ 自动识别上传的照片是否包含人物
- ✅ 使用 OpenAI 兼容 API（支持配置管理）
- ✅ 批量识别多张照片
- ✅ 友好的错误提示（指出哪些照片不符合要求）
- ✅ 仅对登录用户启用（游客模式跳过验证）
- ✅ 与模型配置管理集成

## 工作流程

### 方式一：上传时验证（推荐）✅

```
用户选择照片上传
    ↓
[登录用户] 逐张识别是否包含人物
    ↓
├─ 包含人物 → 上传到 MinIO → 显示成功
└─ 不含人物 → 不上传 → 显示红色边框和错误提示
    ↓
用户可以删除不合格照片，重新上传
    ↓
点击生成时，只使用已上传到 MinIO 的照片
```

### 方式二：生成时验证（备用）

```
用户点击生成
    ↓
[登录用户] → 调用图片识别 API
    ↓
验证每张照片是否包含人物
    ↓
├─ 全部通过 → 继续生成流程
└─ 有不合格 → 显示错误提示，中止生成
```

**当前实现：同时支持两种方式**
- 上传时验证：在 `PhotoUploader` 中，上传前先识别
- 生成时验证：在 `CreatePage` 中，生成前再次验证（双重保险）

## 技术实现

### 1. API 路由

**路径**: `/api/identify-image`

**请求**:
```json
POST /api/identify-image
Authorization: Bearer <token>
Content-Type: application/json

{
  "images": [
    "data:image/jpeg;base64,...",
    "https://example.com/image.jpg"
  ]
}
```

**响应**:
```json
{
  "success": true,
  "total": 2,
  "validCount": 2,
  "invalidCount": 0,
  "allValid": true,
  "results": [
    {
      "index": 0,
      "success": true,
      "hasPerson": true,
      "confidence": 0.9,
      "description": "YES - 检测到人物"
    },
    {
      "index": 1,
      "success": true,
      "hasPerson": true,
      "confidence": 0.9,
      "description": "YES - 包含清晰的人脸"
    }
  ]
}
```

### 2. Hook

#### useImageIdentification (生成时验证)

**文件**: `app/hooks/useImageIdentification.ts`

```typescript
const { isIdentifying, identifyImages } = useImageIdentification();

// 使用
const result = await identifyImages(uploadedPhotos);
if (!result.allValid) {
  // 处理不合格的照片
}
```

#### usePhotoUpload (上传时验证) ✅

**文件**: `app/hooks/usePhotoUpload.ts`

在上传流程中集成识别：

```typescript
const handleFileSelect = async (files: FileList | null) => {
  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    
    // 1. 先识别图片是否包含人物
    const identifyResult = await identifyPerson(dataUrl);
    
    if (!identifyResult.hasPerson) {
      // 不包含人物，不上传到 MinIO，记录错误
      identifyErrors.set(index, `未检测到人物: ${identifyResult.description}`);
      continue;
    }
    
    // 2. 包含人物，继续质量检查和上传
    const quality = await checkImageQuality(dataUrl);
    const minioUrl = await uploadToMinio(dataUrl);
  }
};
```

### 3. PhotoUploader 集成 ✅

**文件**: `app/components/PhotoUploader.tsx`

显示识别错误：

```typescript
{identifyErrorCount > 0 && (
  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
    <AlertCircle className="w-5 h-5 text-red-600" />
    <div className="text-sm text-red-800">
      <p className="font-medium">发现 {identifyErrorCount} 张照片未检测到人物</p>
      <p>这些照片未上传到服务器，请删除并重新上传包含人物的照片</p>
    </div>
  </div>
)}
```

照片卡片显示错误：

```typescript
<SortablePhoto
  identifyError={identifyErrors.get(index)}
  // 红色边框 + 底部错误提示
/>
```

### 4. CreatePage 集成（双重验证）

在 `handleGenerate` 中：

1. 检查是否为登录用户
2. 调用 `identifyImages` 验证照片
3. 如果有不合格照片，显示错误提示并中止
4. 如果全部通过，继续生成流程

## 配置管理

### 数据库配置

在 `model_configs` 表中创建 `type='identify-image'` 的配置：

| 字段 | 示例值 |
|------|--------|
| type | `identify-image` |
| name | `OpenAI 图片识别` |
| api_base_url | `https://api.openai.com` |
| api_key | `sk-...` |
| model_name | `gpt-4o-mini` |
| status | `active` |

### 环境变量回退

如果没有激活的数据库配置，使用环境变量：

```env
IDENTIFY_API_BASE_URL=https://api.openai.com
IDENTIFY_API_KEY=sk-...
IDENTIFY_MODEL=gpt-4o-mini
```

## 使用指南

### 1. 配置识别模型

访问管理后台：`/admin/model-configs`

1. 点击「新建配置」
2. 配置类型选择「识别图片」
3. 填写 API 信息：
   - API Base URL: `https://api.openai.com`
   - API Key: 你的 OpenAI API Key
   - 模型名称: `gpt-4o-mini`（推荐）或 `gpt-4o`
4. 状态选择「激活」
5. 点击「创建」

### 2. 用户体验

#### 上传时验证（主要流程）✅

**登录用户**：
1. 选择照片上传
2. 系统显示「正在验证和分析照片...」
3. 逐张识别：
   - ✅ 包含人物 → 上传成功，显示绿色勾
   - ❌ 不含人物 → 不上传，显示红色边框 + 错误提示
4. 顶部显示汇总：「发现 X 张照片未检测到人物」
5. 用户可以：
   - 删除不合格照片
   - 重新上传包含人物的照片
6. 点击「生成婚纱照」时，只使用已上传到 MinIO 的照片

**游客用户**：
- 跳过图片验证，直接上传（模拟模式）

#### 生成时验证（双重保险）

**登录用户**：
1. 点击「生成婚纱照」
2. 系统显示「正在验证图片...」
3. 验证通过后显示「图片验证通过，开始生成...」
4. 如果有不合格照片，显示「第 X 张图片未检测到人物，请重新上传包含人物的照片」

**优势**：
- 上传时验证：即时反馈，用户体验好
- 生成时验证：双重保险，确保数据质量

## API 提示词

系统使用以下提示词进行识别：

```
请判断这张图片中是否包含人物。
只需回答 YES 或 NO，并简要说明理由（不超过20字）。
格式：YES/NO - 理由
```

示例响应：
- `YES - 检测到清晰的人脸`
- `NO - 仅包含风景`
- `YES - 包含多个人物`

## 错误处理

### 识别失败

如果某张图片识别失败（API 错误等），会标记为不合格：

```json
{
  "index": 0,
  "success": false,
  "hasPerson": false,
  "confidence": 0,
  "description": "识别失败: API 请求超时"
}
```

### 用户提示

系统会友好地提示用户：

```
第 1, 3 张图片未检测到人物，请重新上传包含人物的照片
```

## 性能优化

### 并行识别

使用 `Promise.all` 并行识别多张图片，提高速度：

```typescript
const results = await Promise.all(
  images.map(async (imageUrl, index) => {
    return await identifyPerson(imageUrl, ...);
  })
);
```

### 模型选择

- **推荐**: `gpt-4o-mini` - 速度快，成本低，准确度高
- **备选**: `gpt-4o` - 准确度更高，但成本较高

## 成本估算

以 OpenAI 为例（2025年价格）：

- **gpt-4o-mini**: 约 $0.00015 / 图片
- **gpt-4o**: 约 $0.0025 / 图片

每次生成验证 5 张图片：
- gpt-4o-mini: $0.00075
- gpt-4o: $0.0125

## 扩展建议

### 短期优化

1. **缓存识别结果**：相同图片不重复识别
2. **批量识别优化**：支持单次请求识别多张图片
3. **更详细的反馈**：显示每张图片的识别结果和建议

### 长期优化

1. **本地模型**：使用 YOLO 等本地模型降低成本
2. **多模型支持**：支持 Claude、Gemini 等其他视觉模型
3. **智能建议**：识别照片质量、角度、光线等，给出优化建议
4. **人脸检测**：使用专门的人脸检测 API 提高准确度

## 文件清单

### API 路由
- `app/api/identify-image/route.ts` - 图片识别 API

### Hooks
- `app/hooks/useImageIdentification.ts` - 图片识别 Hook（生成时验证）
- `app/hooks/usePhotoUpload.ts` - 照片上传 Hook（上传时验证）✅

### 组件
- `app/components/CreatePage.tsx` - 集成图片验证的创建页面（生成时验证）
- `app/components/PhotoUploader.tsx` - 照片上传组件（上传时验证）✅
- `app/components/photo-uploader/SortablePhoto.tsx` - 照片卡片组件（显示识别错误）✅

### 类型定义
- `app/types/model-config.ts` - 添加 `identify-image` 类型
- `app/types/photo.ts` - 添加 `identifyError` 字段 ✅

### 数据库
- `database-migrations/2025-10-15-create-model-configs.sql` - 支持 `identify-image` 类型

## 故障排查

### 问题：识别一直失败

**检查步骤**：
1. 确认数据库中有激活的 `identify-image` 配置
2. 检查 API Key 是否有效
3. 查看服务器日志中的详细错误信息
4. 测试 API 连接是否正常

### 问题：识别速度慢

**优化方案**：
1. 使用 `gpt-4o-mini` 替代 `gpt-4o`
2. 检查网络连接
3. 考虑使用国内 API 代理

### 问题：误判率高

**解决方案**：
1. 使用更强大的模型（如 `gpt-4o`）
2. 优化提示词，增加更多上下文
3. 调整 `temperature` 参数（当前为 0.1）

## 总结

图片识别功能通过 AI 模型自动验证上传照片的质量，确保生成效果。该功能与模型配置管理深度集成，支持灵活配置和回退机制，提供了良好的用户体验和可维护性。

