# OpenRouter HTML 修改日志

## 2025-01-04 - 修复 Gemini 2.5 Flash Image 响应解析

### 问题描述
使用 `google/gemini-2.5-flash-image` 模型时，返回的图片数据格式与预期不符，导致无法正确解析和显示图片。

### 返回数据格式分析

#### 实际格式（重要！）

根据实际测试，`google/gemini-2.5-flash-image` 返回的格式是：

```json
{
  "choices": [{
    "delta": {
      "role": "assistant",
      "content": "",
      "images": [{
        "type": "image_url",
        "image_url": {
          "url": "data:image/png;base64,iVBORw0KG..."
        },
        "index": 0
      }]
    },
    "finish_reason": "stop"
  }]
}
```

**关键点：图片数据在 `delta.images[0].image_url.url` 中！**

#### 其他可能的格式

**Markdown格式：**
```
![image](data:image/png;base64,iVBORw0KG...)
```

**JSON格式：**
```json
{
  "content": [
    {
      "type": "image",
      "source": {
        "type": "base64",
        "media_type": "image/png",
        "data": "iVBORw0KG..."
      }
    }
  ]
}
```

### 流式响应完整示例

根据 `note.md` 第52行的实际数据：

```json
{
  "id": "gen-xxx",
  "provider": "Google",
  "model": "google/gemini-2.5-flash-image",
  "choices": [{
    "index": 0,
    "delta": {
      "role": "assistant",
      "content": "",
      "images": [{
        "type": "image_url",
        "image_url": {
          "url": "data:image/png;base64,iVBORw0KG..."
        },
        "index": 0
      }]
    },
    "finish_reason": "stop"
  }]
}
```

### 主要修改

#### 1. 增强流式数据处理（第 725-761 行）

**关键发现：图片数据在 `delta.images` 数组中！**

**修改后：**
```javascript
// 处理流式增量内容（delta）
if (parsed.choices?.[0]?.delta) {
  const delta = parsed.choices[0].delta;
  
  // 检查是否有图片数据（images数组） - 这是关键！
  if (delta.images && Array.isArray(delta.images) && delta.images.length > 0) {
    for (const img of delta.images) {
      if (img.image_url?.url) {
        // 直接保存完整的 data URL
        content = img.image_url.url;
        break;
      }
    }
  }
  // 处理文本内容
  else if (delta.content) {
    const deltaContent = delta.content;
    // 过滤 PROCESSING 标记
    if (!deltaContent.includes("OPENROUTER PROCESSING")) {
      content += deltaContent;
    }
  }
}
```

#### 2. 新增 `renderImageResult()` 方法（第 779-866 行）

提取公共的图片渲染逻辑，避免代码重复：

```javascript
renderImageResult(imageDataUrl, imageType, base64String, originalContent = '') {
  // 统一的图片显示逻辑
  // 包括：图片展示、信息显示、下载、复制、调试等功能
}
```

#### 3. 增强 `displayResult()` 方法（第 927-1020+ 行）

支持多种格式的自动识别和解析：

```javascript
displayResult(content) {
  // 1. 清理 PROCESSING 标记
  const cleanedContent = content.replace(/:\s*OPENROUTER\s+PROCESSING\s*/gi, '').trim();
  
  // 2. 检查是否直接是 data URL 格式（最常见！）
  if (cleanedContent.startsWith('data:image/')) {
    const match = cleanedContent.match(/^data:image\/([^;]+);base64,(.+)$/);
    if (match) {
      const imageType = match[1];
      const base64String = match[2];
      this.renderImageResult(cleanedContent, imageType, base64String, content);
      return;
    }
  }
  
  // 3. 尝试 JSON 格式解析
  try {
    const jsonData = JSON.parse(cleanedContent);
    if (jsonData.content && Array.isArray(jsonData.content)) {
      for (const item of jsonData.content) {
        if (item.type === 'image' && item.source?.data) {
          // 提取并渲染图片
          this.renderImageResult(...);
          return;
        }
      }
    }
  } catch (e) {
    // 不是JSON格式，继续
  }
  
  // 4. 尝试 Markdown 格式解析
  const base64ImageMatch = cleanedContent.match(/!\[image\]\(data:...)/);
  if (base64ImageMatch) {
    this.renderImageResult(...);
    return;
  }
  
  // 5. 其他格式处理（URL、文本等）
  // ...
}
```

### 兼容性

✅ 向后兼容旧的 Markdown 格式
✅ 支持新的 JSON 格式
✅ 保留所有原有功能
✅ 增强错误处理和调试信息

### 测试建议

1. **测试 JSON 格式响应**：
   - 使用 `google/gemini-2.5-flash-image` 模型
   - 验证图片能正确显示

2. **测试 Markdown 格式响应**：
   - 使用其他返回 Markdown 格式的模型
   - 确保向后兼容

3. **测试错误处理**：
   - 空响应
   - 只有 PROCESSING 标记
   - 格式错误的数据

### 调试信息

修改后会输出以下调试信息：

```
✅ 检测到完整消息内容
✅ 在流式响应中检测到图片数据
流式接收完成
原始内容长度: xxx
清理后内容长度: xxx
PROCESSING标记出现次数: xxx
内容前100字符: {...}
✅ 检测到JSON格式响应
✅ 检测到JSON格式的图片数据
📊 图片类型: png | 数据长度: xxx | 预估大小: xxx KB
```

### 相关文件

- `openRouter.html` - 主要修改文件
- `note.md` - 实际返回数据示例
- `image-edit-demo.html` - 原始参考实现

### 下一步

如果仍然遇到问题，请检查：

1. 浏览器控制台的完整日志
2. Network 标签中的实际响应数据
3. 是否有其他 JavaScript 错误
