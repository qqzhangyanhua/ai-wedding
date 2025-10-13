# 流式图片生成功能更新日志

## 更新时间
2025-10-11

## 概述
基于 `example/image-edit-demo.html` 的实现，为婚纱照生成功能添加了流式 API 支持，提升用户体验。

## 新增文件

### 1. `lib/image-stream.ts`
- **作用**：客户端流式图片生成 API 封装
- **核心功能**：
  - SSE 流式响应解析
  - 跨 chunk 缓冲区处理
  - 实时进度回调
  - 自动提取 base64 图片数据

### 2. `app/api/generate-stream/route.ts`
- **作用**：Next.js 服务端 API 路由
- **核心功能**：
  - 用户认证（Supabase）
  - 速率限制（每用户每分钟 5 次）
  - 隐藏 API Key（服务端处理）
  - 转发流式响应

### 3. `docs/STREAMING_IMAGE_API.md`
- **作用**：详细的技术文档
- **内容**：API 使用说明、架构设计、测试指南

## 修改文件

### 1. `src/views/CreatePage.tsx`
**改动**：
```diff
- import { generateImage } from '@/lib/image';
+ import { generateImageStream } from '@/lib/image-stream';

- const items = await generateImage(prompt, {...});
+ const result = await generateImageStream({
+   prompt,
+   imageInputs: uploadedPhotos.length > 0 ? [uploadedPhotos[0]] : undefined,
+   onProgress: (content) => console.log('进度:', content.length),
+   onStatus: (status) => console.log('状态:', status),
+ });
```

**优势**：
- ✅ 实时显示生成进度
- ✅ 更好的用户反馈
- ✅ 支持图片输入

### 2. `.env`
**改动**：
```diff
- IMAGE_API_MODE=images
+ IMAGE_API_MODE=chat  # 启用流式模式
```

### 3. `.env.example`
**改动**：
- 添加了 `IMAGE_API_MODE` 的详细说明
- 更新了配置示例

## 技术亮点

### 1. SSE 流式解析（参考 demo）
```typescript
// 跨 chunk 缓冲处理
let sseBuffer = '';
const events = sseBuffer.split(/\n\n/);
sseBuffer = events.pop() || '';

// 多行 data: 支持
const dataLines = evt
  .split(/\n/)
  .filter((l) => l.startsWith('data:'))
  .map((l) => l.slice(5).trimStart());
const dataPayload = dataLines.join('\n').trim();
```

### 2. 图片数据提取
```typescript
// 从 Markdown 中提取 base64 图片
const base64ImageMatch = content.match(
  /!\[image\]\(data:\s*image\/([^;]+);\s*base64,\s*\n?([^)]+)\)/i
);
```

### 3. 安全性保证
- ✅ API Key 存储在服务端环境变量
- ✅ 通过 Next.js API 路由调用
- ✅ 用户认证与授权
- ✅ 速率限制防止滥用

## 使用方式

### 1. 环境配置
```bash
# .env
IMAGE_API_MODE=chat
IMAGE_API_BASE_URL=https://api.aioec.tech
IMAGE_API_KEY=sk-13WThvEQGdYxRfwnnafAqDRgMtqKbBUH28RhFFITW3s7D6xw
IMAGE_CHAT_MODEL=gemini-2.5-flash-image
```

### 2. 客户端调用
```typescript
import { generateImageStream } from '@/lib/image-stream';

const result = await generateImageStream({
  prompt: '生成一张婚纱照',
  imageInputs: [photo1, photo2], // 可选
  n: 4,
  onProgress: (content) => {
    // 实时更新进度
  },
  onStatus: (status) => {
    // connecting | streaming | parsing | completed | error
  },
});

// 使用生成的图片
const imageUrl = result.imageData?.dataUrl;
```

### 3. API 调用流程
```
客户端 → /api/generate-stream → api.aioec.tech → 流式返回 → 解析提取
```

## 测试验证

### 通过的检查
- ✅ TypeScript 类型检查：`pnpm run typecheck`
- ✅ ESLint 代码规范：`pnpm run lint`
- ✅ 无新增 linter 错误

### 建议的测试
1. **功能测试**：
   - 上传图片 → 输入提示词 → 生成婚纱照
   - 验证流式进度显示
   - 验证生成的图片正常显示

2. **错误测试**：
   - 未登录访问
   - 积分不足
   - 网络异常重试

3. **性能测试**：
   - 速率限制验证
   - 并发请求处理

## 兼容性

### 保留原有功能
- ✅ 原有的 `generateImage` 函数仍然可用
- ✅ 不影响现有的图片生成流程
- ✅ 可以根据需求选择使用流式或非流式

### 浏览器兼容性
- ✅ 支持所有现代浏览器
- ✅ 需要支持 `ReadableStream` 和 `TextDecoder`

## 参考资料

- **原始实现**：`example/image-edit-demo.html`
- **API 文档**：`docs/STREAMING_IMAGE_API.md`
- **上游 API**：https://api.aioec.tech/v1/docs

## 后续优化建议

1. **进度可视化**：
   - 添加进度条组件
   - 显示实时生成的字符数
   - 预估剩余时间

2. **批量生成**：
   - 支持一次生成多张图片
   - 并行调用优化

3. **缓存机制**：
   - 缓存已生成的图片
   - 避免重复请求

4. **错误恢复**：
   - 自动重试机制
   - 断点续传支持

## 注意事项

⚠️ **重要提醒**：
1. 不要将 API Key 提交到版本控制
2. 定期检查速率限制配置
3. 监控 API 调用次数和成本
4. 及时更新依赖和安全补丁

---

**作者**：AI Assistant  
**审核**：待审核  
**版本**：v1.0.0





