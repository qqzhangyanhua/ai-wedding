# 示例文件说明

本目录包含各种 API 测试和演示文件。

## 文件列表

### 1. `image-edit-demo-302ai.html` ⭐
**完整的图片风格转换演示页面**
- ✅ 已修复 Base64 格式问题
- 使用 Gemini 原生 API 格式
- 包含模板选择、提示词列表
- 支持拖拽上传
- 完整的 UI 和错误处理

**使用方法：**
```bash
# 直接在浏览器中打开
open example/image-edit-demo-302ai.html
```

**关键修复：**
- ❌ 旧代码：使用 `image_url` 传递 Base64（错误）
- ✅ 新代码：使用 `inline_data` 结构传递 Base64（正确）

```javascript
// 修复前（错误）
{
    "image_url": "data:image/jpeg;base64,..."
}

// 修复后（正确）
{
    "inline_data": {
        "mime_type": "image/jpeg",
        "data": "BASE64_STRING"
    }
}
```

---

### 2. `test-gemini-base64.html` 🧪
**简化的 API 测试工具**
- 专注于测试 Base64 格式
- 实时显示请求体预览
- 详细的错误信息和调试建议
- 适合快速验证 API 调用

**使用方法：**
```bash
# 在浏览器中打开
open example/test-gemini-base64.html
```

**功能：**
1. 上传图片并自动转换为 Base64
2. 输入提示词
3. 实时预览请求体结构
4. 一键测试 API 调用
5. 查看详细的响应数据

---

### 3. `template-data.js`
**模板数据文件**
- 包含婚纱照风格模板
- 被 `image-edit-demo-302ai.html` 引用
- 包含模板名称、分类、预览图、提示词列表

---

### 4. `list.json`
**模板数据的 JSON 版本**
- 与 `template-data.js` 内容相同
- 用于 API 返回或其他用途

---

## 官方 curl 示例问题分析

### 官方示例（使用 HTTP URL）
```bash
curl --location --request POST 'https://api.302.ai/google/v1/models/gemini-2.5-flash-image?response_format' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data-raw '{
    "contents": [
        {
            "parts": [
                {
                    "text": "变成Ghibli卡通风格"
                },
                {
                    "image_url": "https://file.302ai.cn/gpt/imgs/20250507/d778f9319c534b1c8ffc49c15db14fb1.jpg"
                }
            ]
        }
    ],
    "generationConfig": {
        "responseModalities": ["TEXT", "IMAGE"]
    }
}'
```

### 问题点

1. **URL 参数不完整**
   - `?response_format` 没有值
   - 建议移除或使用 `?response_format=url`

2. **使用 HTTP URL 而不是 Base64**
   - 官方示例使用的是图片 URL
   - 如果要用 Base64，必须改用 `inline_data` 结构

### 正确的 Base64 格式 ✅

```bash
curl --location --request POST 'https://api.302.ai/google/v1/models/gemini-2.5-flash-image' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data-raw '{
    "contents": [
        {
            "parts": [
                {
                    "text": "变成Ghibli卡通风格"
                },
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": "BASE64_STRING_HERE"
                    }
                }
            ]
        }
    ],
    "generationConfig": {
        "responseModalities": ["TEXT", "IMAGE"]
    }
}'
```

---

## 两种 API 格式对比

### Gemini 原生格式（前端演示）
- **端点**: `/google/v1/models/gemini-2.5-flash-image`
- **Base64**: 使用 `inline_data` 结构
- **消息**: `contents[].parts[]`
- **适用**: 前端直接调用

### OpenAI 兼容格式（后端 API）
- **端点**: `/v1/chat/completions`
- **Base64**: 使用 `image_url.url` (Data URL)
- **消息**: `messages[].content[]`
- **适用**: 后端服务，支持流式响应

详见：`docs/GEMINI_API_FORMATS.md`

---

## 测试步骤

### 快速测试（推荐）
1. 打开 `test-gemini-base64.html`
2. 上传一张图片
3. 输入提示词（或使用默认）
4. 点击"测试 API"按钮
5. 查看结果和详细日志

### 完整演示
1. 打开 `image-edit-demo-302ai.html`
2. 选择婚纱照风格模板（可选）
3. 上传原图
4. 选择或输入提示词
5. 点击"开始AI编辑"
6. 查看生成结果

---

## 常见问题

### Q1: API 返回 400 错误
**原因**: 请求体格式不正确
**解决**: 确保使用 `inline_data` 而不是 `image_url` 传递 Base64

### Q2: API 返回 401 错误
**原因**: API Key 无效或过期
**解决**: 检查并更新 API Key

### Q3: 图片无法上传
**原因**: 文件太大或格式不支持
**解决**: 
- 确保图片小于 10MB
- 支持格式：JPG, PNG, WebP

### Q4: 生成的图片人脸变形
**原因**: 提示词没有包含人脸保护指令
**解决**: 使用后端 API（`/api/generate-single`），会自动添加人脸保护提示词

---

## 相关文档

- [Gemini API 格式对比](../docs/GEMINI_API_FORMATS.md)
- [图片生成功能说明](../docs/GENERATE_SINGLE_FEATURE.md)
- [提示词优化指南](../docs/prompt-optimization-v3-success-case.md)

---

## 更新日志

- **2025-11-05**: 修复 `image-edit-demo-302ai.html` 的 Base64 格式问题
- **2025-11-05**: 添加 `test-gemini-base64.html` 测试工具
- **2025-11-05**: 创建格式对比文档

