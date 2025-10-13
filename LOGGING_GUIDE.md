# 📝 日志增强完成 - 快速查看指南

## ✅ 已完成的改进

### 1. 详细日志系统

两个 API 接口都已添加详细的日志：

- ✅ `/api/generate-image` - 非流式图片生成（Chat 模式）
- ✅ `/api/generate-stream` - 流式图片生成

### 2. 日志内容

每个请求包含以下日志：

#### 🔍 请求开始
```
[req_xxx] ========== 开始处理图片生成请求 ==========
[req_xxx] 环境变量检查: { IMAGE_API_MODE, IMAGE_API_BASE_URL, ... }
```

#### 👤 用户认证
```
[req_xxx] 认证 Header: Bearer ...
[req_xxx] ✅ 用户认证成功: user-id
```

#### 📋 参数验证
```
[req_xxx] 请求 Body: { prompt, image_inputs, n, ... }
[req_xxx] ✅ 参数验证通过: { ... }
```

#### 📤 API 调用
```
[req_xxx] API 端点: https://api.aioec.tech/v1/chat/completions
[req_xxx] 图片输入: 1 张
[req_xxx] 📤 发送请求到上游 API: { model, temperature, ... }
```

#### 📥 响应处理
```
[req_xxx] 📥 收到响应: 200 OK (耗时: 45231ms)
[req_xxx] 📦 上游 API 响应数据: { choices_count, has_content, ... }
[req_xxx] 📄 返回内容预览: ![image](data:image/png;base64,...
```

#### ✅ 成功或 ❌ 失败
```
[req_xxx] ✅ 成功提取图片数据: { mimeType, base64_length, ... }
[req_xxx] ✅ 图片生成成功，返回 4 张图片
[req_xxx] ========== 请求处理完成 ==========
```

或

```
[req_xxx] ❌ 上游 API 返回错误: { status, error, ... }
[req_xxx] ========== 请求处理失败 ==========
```

## 🚀 如何查看日志

### 方法 1: 终端查看（推荐）

```bash
# 1. 启动开发服务器
cd /Users/zhangyanhua/Desktop/AI/ai-wedding
pnpm run dev

# 2. 在浏览器中操作（上传图片、生成）

# 3. 回到终端查看详细日志
# 所有日志都会实时输出到终端
```

### 方法 2: 使用 grep 过滤

```bash
# 只看错误
pnpm run dev 2>&1 | grep "❌"

# 只看成功
pnpm run dev 2>&1 | grep "✅"

# 跟踪特定请求
pnpm run dev 2>&1 | grep "req_1234567890"
```

### 方法 3: 保存到文件

```bash
# 将日志保存到文件
pnpm run dev 2>&1 | tee logs/debug.log

# 然后可以用编辑器查看
cat logs/debug.log
```

## 🔍 快速排查问题

### 步骤 1: 找到失败的请求

在终端日志中搜索 `❌` 符号：

```
[req_1234567890_abc123] ❌ 上游 API 返回错误: {
  status: 400,
  error: "Invalid request"
}
```

### 步骤 2: 查看完整的请求上下文

复制 `requestId`（例如 `req_1234567890_abc123`），在终端中搜索：

```bash
# Mac/Linux
grep "req_1234567890_abc123" logs/debug.log

# 或直接在终端输出中查找
```

### 步骤 3: 对比 demo

1. 打开 `example/image-edit-demo.html`
2. 在浏览器中运行，打开开发者工具
3. 对比请求格式

### 步骤 4: 检查环境变量

```bash
# 查看 .env 文件
cat .env

# 确认配置正确
IMAGE_API_MODE=chat
IMAGE_API_BASE_URL=https://api.aioec.tech
IMAGE_API_KEY=sk-13WThvEQGdYxRfwnnafAqDRgMtqKbBUH28RhFFITW3s7D6xw
IMAGE_CHAT_MODEL=gemini-2.5-flash-image
```

## 📊 日志示例对比

### ✅ 成功的请求

```
[req_xxx] ========== 开始处理图片生成请求 ==========
[req_xxx] ✅ 用户认证成功: xxx
[req_xxx] ✅ 参数验证通过: {...}
[req_xxx] 📤 发送请求到上游 API: {...}
[req_xxx] 📥 收到响应: 200 OK (耗时: 45231ms)
[req_xxx] ✅ 成功提取图片数据: {...}
[req_xxx] ✅ 图片生成成功，返回 4 张图片
[req_xxx] ========== 请求处理完成 ==========
```

### ❌ 失败的请求（环境变量未配置）

```
[req_xxx] ========== 开始处理图片生成请求 ==========
[req_xxx] 环境变量检查: {
  IMAGE_API_KEY: 'missing'  ← 问题在这里
}
[req_xxx] ❌ IMAGE_API_KEY 未配置
```

**解决方案**: 检查 `.env` 文件，添加 `IMAGE_API_KEY`

### ❌ 失败的请求（用户未登录）

```
[req_xxx] ========== 开始处理图片生成请求 ==========
[req_xxx] 认证 Header: missing  ← 问题在这里
[req_xxx] ❌ 未提供认证 Token
```

**解决方案**: 在浏览器中登录

### ❌ 失败的请求（上游 API 错误）

```
[req_xxx] 📤 发送请求到上游 API: {...}
[req_xxx] 📥 收到响应: 400 Bad Request (耗时: 523ms)
[req_xxx] ❌ 上游 API 返回错误: {
  status: 400,
  error: {
    message: "Invalid model",  ← 问题在这里
    type: "invalid_request_error"
  }
}
```

**解决方案**: 检查 `IMAGE_CHAT_MODEL` 配置，确保模型名称正确

## 🎯 关键检查点

按以下顺序检查：

1. **环境变量** ✅
   ```
   [req_xxx] 环境变量检查: { IMAGE_API_KEY: 'sk-13WThv...', ... }
   ```

2. **用户认证** ✅
   ```
   [req_xxx] ✅ 用户认证成功: user-id
   ```

3. **参数验证** ✅
   ```
   [req_xxx] ✅ 参数验证通过: { prompt, n, ... }
   ```

4. **API 调用** ✅
   ```
   [req_xxx] 📥 收到响应: 200 OK
   ```

5. **图片提取** ✅
   ```
   [req_xxx] ✅ 成功提取图片数据
   ```

## 📚 更多帮助

- **详细调试指南**: `docs/DEBUG_GUIDE.md`
- **API 使用文档**: `docs/STREAMING_IMAGE_API.md`
- **更新日志**: `CHANGELOG_STREAMING.md`
- **原始 demo**: `example/image-edit-demo.html`

## 💡 提示

1. **保持终端可见**: 在开发时，始终保持终端窗口可见，实时查看日志
2. **使用 requestId**: 每个请求都有唯一 ID，方便追踪
3. **对比 demo**: 遇到问题时，先在 demo 中测试
4. **重启服务器**: 修改 `.env` 后必须重启开发服务器

---

**当前状态**: ✅ 日志系统已完善，API 入参已对齐 demo 格式

现在你可以：
1. 启动开发服务器：`pnpm run dev`
2. 在浏览器中测试生成功能
3. 在终端查看详细的请求日志
4. 根据日志快速定位问题





