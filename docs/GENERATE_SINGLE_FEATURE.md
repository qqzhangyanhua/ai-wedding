# 生成单张图片功能说明

## 功能概述

这是一个全新的 AI 图片编辑功能，允许用户上传单张照片，选择风格模板或输入自定义提示词，生成全新的婚纱照效果。

## 访问路径

- **路由**: `/generate-single`
- **首页入口**: 点击首页的"生成单张"按钮
- **导航栏**: 顶部导航栏中的"生成单张"链接

## 主要功能

### 1. 图片上传
- 支持拖拽上传或点击选择
- 支持格式: JPG, PNG, WebP
- 最大文件大小: 10MB
- 实时预览上传的原图

### 2. 模板选择
- 展示前 12 个活跃的模板
- 从 Supabase 数据库动态加载
- 选中模板后自动使用模板的提示词配置
- 可视化选择界面，选中状态高亮显示

### 3. 自定义提示词
- 支持英文提示词输入
- 当选择模板时，提示词输入框自动禁用
- 提供详细的输入建议和示例

### 4. 高级设置
- **五官保持强度**: 
  - 高（推荐）: 严格保持人物面部特征
  - 中: 保持主要面部特征
  - 低: 允许一定程度的面部调整
  
- **创意程度**:
  - 保守（推荐）: temperature=0.2, top_p=0.7
  - 平衡: temperature=0.5, top_p=0.85
  - 创意: temperature=0.8, top_p=0.95

### 5. AI 生成
- 使用 Gemini-2.5-Flash-Image 模型
- 流式响应处理
- 实时显示生成进度
- 错误处理和重试机制

### 6. 结果处理
- 实时显示生成的图片
- 下载图片功能
- 复制 Base64 数据功能
- 支持图片预览

## 技术实现

### 核心组件
- **路由页面**: `app/generate-single/page.tsx`
- **主组件**: `app/components/GenerateSinglePage.tsx`

### 集成点
- **首页**: `app/components/HomePage.tsx` - 添加了"生成单张"按钮
- **导航栏**: `app/components/Header.tsx` - 添加了导航链接
- **路由桥接**: `app/shared/HeaderBridge.tsx` - 添加了路由处理

### API 接口

#### 模板数据
```typescript
// 使用 useTemplates hook 获取模板
const { templates, loading } = useTemplates();

// 数据来源: Supabase templates 表
// 查询条件: is_active=true, 按 sort_order 排序
```

#### 图片生成
```typescript
// API 端点
POST https://gyapi.zxiaoruan.cn/v1/chat/completions

// 请求格式
{
  model: "gemini-2.5-flash-image",
  temperature: 0.2-0.8,
  top_p: 0.7-0.95,
  messages: [{
    role: "user",
    content: [
      { type: "text", text: "增强的提示词" },
      { type: "image_url", image_url: { url: "data:image/jpeg;base64,..." } }
    ]
  }],
  stream: true
}
```

### 提示词增强

系统会根据用户设置自动构建增强的提示词：

```typescript
const enhancedPrompt = `
Please edit the provided original image based on the following guidelines:

${facePreservationText} // 五官保持要求

SPECIFIC EDITING REQUEST: ${basePrompt} // 用户/模板提示词

Please focus your modifications ONLY on the user's specific requirements 
while strictly following the face preservation guidelines above.
`;
```

### 响应处理

使用 SSE (Server-Sent Events) 流式响应:
1. 逐块读取响应流
2. 解析 SSE 事件格式
3. 提取 delta 内容
4. 累积完整响应
5. 解析 Markdown 格式的 base64 图片
6. 渲染最终结果

## 用户体验优化

1. **表单验证**: 确保上传图片和提示词/模板至少选择一项
2. **加载状态**: 生成过程中显示加载动画和进度提示
3. **错误处理**: 友好的错误提示和重试机制
4. **成功反馈**: 操作成功后的视觉反馈
5. **响应式设计**: 适配桌面和移动设备
6. **无障碍**: 符合无障碍访问标准

## 权限控制

- 未登录用户点击"生成"按钮时，自动弹出登录模态框
- 已登录用户可以直接使用所有功能

## 未来改进方向

1. 支持批量生成多张图片
2. 添加生成历史记录
3. 支持更多的图片编辑选项
4. 集成积分消耗系统
5. 添加图片对比功能
6. 支持图片风格迁移
7. 添加更多的 AI 模型选择

## 注意事项

1. **API 密钥安全**: 当前 API 密钥硬编码在客户端，生产环境应该移到服务端
2. **错误监控**: 建议添加错误监控和日志记录
3. **性能优化**: 大图片可能需要压缩处理
4. **费用控制**: 需要实现积分扣除和限流机制

