# Gemini API 格式对比文档

## 问题背景

在使用 302.AI 的 Gemini 2.5 Flash Image 模型时，发现官方示例和实际使用存在差异。本文档对比两种 API 格式。

---

## 格式一：Gemini 原生 API 格式

### 端点
```
POST https://api.302.ai/google/v1/models/gemini-2.5-flash-image
```

### 使用 HTTP URL（官方示例）

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
                    "image_url": "https://file.302ai.cn/gpt/imgs/20250507/d778f9319c534b1c8ffc49c15db14fb1.jpg"
                }
            ]
        }
    ],
    "generationConfig": {
        "responseModalities": [
            "TEXT",
            "IMAGE"
        ]
    }
}'
```

### 使用 Base64（正确格式）⭐

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
        "responseModalities": [
            "TEXT",
            "IMAGE"
        ]
    }
}'
```

### JavaScript 示例（Base64）

```javascript
// 处理 Base64 图片数据
let base64Data = imageUrl;
let mimeType = 'image/jpeg';

if (imageUrl.startsWith('data:')) {
    const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
    }
}

// 构建请求体
const requestBody = {
    "contents": [
        {
            "parts": [
                {
                    "text": prompt
                },
                {
                    "inline_data": {
                        "mime_type": mimeType,
                        "data": base64Data
                    }
                }
            ]
        }
    ],
    "generationConfig": {
        "responseModalities": [
            "TEXT",
            "IMAGE"
        ]
    }
};

// 发送请求
const response = await fetch('https://api.302.ai/google/v1/models/gemini-2.5-flash-image', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
});
```

---

## 格式二：OpenAI 兼容格式（推荐用于后端）

### 端点
```
POST https://api.302.ai/v1/chat/completions
```

### 请求格式

```bash
curl --location --request POST 'https://api.302.ai/v1/chat/completions' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data-raw '{
    "model": "gemini-2.5-flash-image",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "变成Ghibli卡通风格"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "data:image/jpeg;base64,BASE64_STRING_HERE"
                    }
                }
            ]
        }
    ],
    "stream": true,
    "temperature": 0.2,
    "top_p": 0.7
}'
```

### JavaScript 示例

```javascript
const requestData = {
    model: 'gemini-2.5-flash-image',
    temperature: 0.2,
    top_p: 0.7,
    messages: [
        {
            role: 'user',
            content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageDataUrl } }
            ],
        },
    ],
    stream: true,
    stream_options: {
        include_usage: true,
    },
};

const response = await fetch('https://api.302.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestData),
});
```

---

## 关键差异对比

| 特性 | Gemini 原生格式 | OpenAI 兼容格式 |
|------|----------------|-----------------|
| **端点** | `/google/v1/models/gemini-2.5-flash-image` | `/v1/chat/completions` |
| **HTTP URL 字段** | `image_url` (字符串) | `image_url.url` (对象) |
| **Base64 字段** | `inline_data` (对象) | `image_url.url` (Data URL) |
| **Base64 格式** | 分离的 `mime_type` 和 `data` | 完整的 Data URL |
| **消息结构** | `contents[].parts[]` | `messages[].content[]` |
| **流式响应** | 不支持（默认） | 支持 `stream: true` |
| **适用场景** | 前端直接调用 | 后端 API 调用 |

---

## 常见错误

### ❌ 错误 1：在 Gemini 原生格式中使用 `image_url` 传递 Base64

```javascript
// 错误示例
{
    "parts": [
        {
            "image_url": "data:image/jpeg;base64,/9j/4AAQ..."  // ❌ 错误
        }
    ]
}
```

**正确做法**：使用 `inline_data`

```javascript
// 正确示例
{
    "parts": [
        {
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": "/9j/4AAQ..."  // ✅ 正确
            }
        }
    ]
}
```

### ❌ 错误 2：URL 参数不完整

```bash
# 官方示例（可能有误）
?response_format

# 建议
# 不添加此参数，或使用完整参数
?response_format=url
```

### ❌ 错误 3：混淆两种格式

不要在 Gemini 原生格式中使用 OpenAI 的消息结构，反之亦然。

---

## 最佳实践

### 1. 前端直接调用（演示/测试）
- 使用 **Gemini 原生格式**
- Base64 使用 `inline_data` 结构
- 不需要流式响应

### 2. 后端 API（生产环境）
- 使用 **OpenAI 兼容格式**
- 支持流式响应
- 更好的错误处理和积分管理
- 统一的 API 接口

### 3. Base64 处理
```javascript
// 提取纯 Base64 数据
function extractBase64(dataUrl) {
    if (dataUrl.startsWith('data:')) {
        const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
            return {
                mimeType: matches[1],
                base64: matches[2]
            };
        }
    }
    return null;
}
```

---

## 项目中的使用

### 前端演示页面
- 文件：`example/image-edit-demo-302ai.html`
- 格式：Gemini 原生格式（已修复）
- 用途：快速测试和演示

### 生产 API
- 文件：`app/api/generate-single/route.ts`
- 格式：OpenAI 兼容格式
- 用途：正式的图片生成服务

---

## 参考资料

- [Gemini API 官方文档](https://ai.google.dev/gemini-api/docs)
- [302.AI API 文档](https://302.ai)
- [OpenAI API 规范](https://platform.openai.com/docs/api-reference)

---

## 更新日志

- 2025-11-05: 修复 HTML 演示页面的 Base64 格式问题
- 2025-11-05: 添加两种格式的对比文档

