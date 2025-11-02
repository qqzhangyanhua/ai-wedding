# 提示词列表选择功能优化

## 📋 优化概述

为"生成单张"功能添加了对模板 `prompt_list` 的支持，用户现在可以：
1. 选择一个模板
2. 如果模板有多个提示词（`prompt_list`），可以选择其中一个
3. 使用选中的提示词生成图片

## 🎯 功能特性

### 1. 智能提示词选择

#### 模板有 `prompt_list` 时
- 显示所有可用的提示词选项
- 用户可以点击选择任意一个提示词
- 选中的提示词会有明显的视觉反馈
- 显示提示词的完整内容

#### 模板没有 `prompt_list` 时
- 自动使用 `prompt_config.basePrompt`
- 保持原有的行为不变

### 2. 互斥选择逻辑

#### 选择模板时
- 自动清空自定义提示词
- 重置提示词索引为 0（第一个）
- 禁用自定义提示词输入框

#### 输入自定义提示词时
- 自动清除模板选择
- 启用自定义提示词输入框
- 清除提示词索引

### 3. 视觉设计

#### 提示词列表展示
- 卡片式布局，每个提示词一张卡片
- 选中状态：玫瑰金边框 + 浅色背景
- 未选中状态：灰色边框 + 白色背景
- 悬停效果：边框颜色变化 + 背景色变化

#### 状态指示
- 圆形选择器（类似单选按钮）
- 选中时显示对勾图标
- "已选择"标签显示在选中项上
- 风格编号（风格 1, 风格 2...）

#### 信息提示
- 显示可选提示词数量
- 在自定义提示词区域显示当前选择状态
- 友好的使用提示

## 🔧 技术实现

### 新增状态管理

```typescript
// 选中的提示词索引
const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(0);
```

### 核心函数

#### 1. `handleTemplateSelect(template: Template)`
处理模板选择，重置相关状态：
```typescript
const handleTemplateSelect = (template: Template) => {
  setSelectedTemplate(template);
  setSelectedPromptIndex(0); // 重置为第一个提示词
  setCustomPrompt(''); // 清空自定义提示词
};
```

#### 2. `getCurrentPrompt(): string`
获取当前使用的提示词：
```typescript
const getCurrentPrompt = (): string => {
  if (selectedTemplate) {
    // 优先使用 prompt_list
    if (selectedTemplate.prompt_list && selectedTemplate.prompt_list.length > 0) {
      return selectedTemplate.prompt_list[selectedPromptIndex] || selectedTemplate.prompt_list[0];
    }
    // 否则使用 basePrompt
    const promptConfig = typeof selectedTemplate.prompt_config === 'string' 
      ? JSON.parse(selectedTemplate.prompt_config) 
      : selectedTemplate.prompt_config;
    return promptConfig.basePrompt || '';
  }
  return customPrompt.trim();
};
```

### UI 组件结构

```tsx
{/* 模板选择区域 */}
<div className="模板卡片网格">
  {templates.map(template => (
    <TemplateCard 
      selected={selectedTemplate?.id === template.id}
      onClick={() => handleTemplateSelect(template)}
    />
  ))}
</div>

{/* 提示词列表（条件渲染） */}
{selectedTemplate?.prompt_list?.length > 0 && (
  <div className="提示词列表">
    <h3>选择提示词风格（{prompt_list.length} 个可选）</h3>
    {prompt_list.map((prompt, index) => (
      <PromptCard
        selected={selectedPromptIndex === index}
        onClick={() => setSelectedPromptIndex(index)}
        prompt={prompt}
        index={index}
      />
    ))}
  </div>
)}
```

## 📊 数据结构支持

### 模板数据格式

```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  preview_image_url: string;
  prompt_config: {
    basePrompt: string;
    negativePrompt?: string;
    styleModifiers?: string[];
    cfgScale?: number;
    steps?: number;
  };
  prompt_list?: string[]; // 新增：提示词列表
  price_credits: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}
```

### 示例数据

```json
{
  "id": "8a259166-863e-4be7-8bf2-233c9b5f5448",
  "name": "韩式室内婚纱照风格",
  "prompt_list": [
    "Full body wedding portrait of a happy young Asian couple...",
    "Korean-style wedding photography...",
    "A minimalist and chic wedding photo...",
    "High-fashion studio portrait...",
    "A romantic and elegant studio wedding photo..."
  ]
}
```

## 🎨 用户体验优化

### 1. 清晰的视觉层次
- 模板选择 → 提示词选择 → 自定义提示词
- 每个区域都有明确的标题和说明
- 使用分隔线区分不同区域

### 2. 即时反馈
- 点击模板立即显示提示词列表
- 选中提示词立即更新视觉状态
- 在自定义提示词区域显示当前选择

### 3. 防止误操作
- 选择模板时自动清空自定义提示词
- 输入自定义提示词时自动清除模板
- 禁用状态的输入框有明显的视觉提示

### 4. 友好的提示信息
```
💡 提示：可以选择上方的模板，或在此输入自定义提示词
```

```
已选择模板 韩式室内婚纱照风格 - 风格 1
```

```
选择提示词风格（5 个可选）
```

## 🔄 交互流程

### 流程 A：使用模板提示词
1. 用户上传图片
2. 用户点击选择一个模板
3. 如果模板有 `prompt_list`，显示提示词列表
4. 用户点击选择一个提示词
5. 点击"开始AI编辑"生成图片

### 流程 B：使用自定义提示词
1. 用户上传图片
2. 用户在自定义提示词框输入文本
3. 如果之前选择了模板，自动清除模板选择
4. 点击"开始AI编辑"生成图片

### 流程 C：切换选择
1. 用户先选择了模板和提示词
2. 用户决定使用自定义提示词
3. 在输入框输入文本，模板选择自动清除
4. 或者反过来，输入自定义提示词后选择模板

## 📱 响应式设计

### 桌面端
- 提示词卡片完整显示
- 提示词文本不截断
- 舒适的间距和布局

### 平板端
- 提示词卡片自适应宽度
- 保持良好的可读性

### 移动端
- 提示词卡片堆叠显示
- 文本自动换行
- 触摸友好的点击区域

## ✅ 测试场景

### 功能测试
- ✅ 选择有 `prompt_list` 的模板
- ✅ 选择没有 `prompt_list` 的模板
- ✅ 切换不同的提示词
- ✅ 从模板切换到自定义提示词
- ✅ 从自定义提示词切换到模板
- ✅ 生成按钮的启用/禁用状态

### 边界测试
- ✅ `prompt_list` 为空数组
- ✅ `prompt_list` 为 null/undefined
- ✅ 提示词内容很长
- ✅ 提示词数量很多（>10个）

### 视觉测试
- ✅ 选中状态的视觉反馈
- ✅ 悬停效果
- ✅ 禁用状态的显示
- ✅ 响应式布局

## 🎯 优化效果

### 用户体验提升
1. **更灵活的选择** - 一个模板可以有多种风格
2. **更直观的操作** - 看到完整的提示词内容
3. **更清晰的状态** - 知道当前选择了什么
4. **更少的错误** - 互斥逻辑防止冲突

### 功能完整性
1. **向后兼容** - 支持旧的 `basePrompt` 格式
2. **扩展性强** - 支持任意数量的提示词
3. **类型安全** - 完整的 TypeScript 类型定义
4. **代码质量** - 通过所有 Lint 检查

## 📝 代码质量

### TypeScript
- ✅ 所有类型明确定义
- ✅ 无 `any` 类型使用
- ✅ 完整的类型推导

### ESLint
- ✅ 无 Lint 错误
- ✅ 遵循项目代码规范

### 代码组织
- ✅ 逻辑清晰
- ✅ 函数职责单一
- ✅ 注释完整

## 🚀 未来扩展

### 可能的改进
1. **提示词预览** - 为每个提示词生成缩略图预览
2. **提示词编辑** - 允许用户微调选中的提示词
3. **提示词收藏** - 保存常用的提示词
4. **提示词分类** - 按风格、场景等分类
5. **智能推荐** - 根据上传的图片推荐合适的提示词

### 性能优化
1. **虚拟滚动** - 当提示词数量很多时
2. **懒加载** - 按需加载提示词内容
3. **缓存** - 缓存已选择的提示词

## 📊 总结

这次优化成功实现了对模板 `prompt_list` 的完整支持，让用户可以：
- 从一个模板中选择多个不同风格的提示词
- 灵活切换模板、提示词和自定义输入
- 获得清晰的视觉反馈和友好的交互体验

所有代码都保持了高质量标准，通过了类型检查和代码质量检查，可以立即投入使用！🎉

