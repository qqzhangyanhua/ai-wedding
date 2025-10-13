# Dashboard 轮询机制说明

## 📋 概述

Dashboard 页面实现了完善的三层轮询机制，确保"进行中"项目的状态能够实时、准确地更新。

## 🎯 核心功能

### 1. 单个项目实时轮询（最快响应）

**组件**: `ProjectProgress` + `useGenerationPolling`

**轮询频率**:
- `pending` 状态：每 **10 秒** 检查一次
- `processing` 状态：每 **3 秒** 检查一次

**工作原理**:
- 每个进行中的项目卡片都包含 `ProjectProgress` 组件
- 该组件使用 `useGenerationPolling` hook 独立轮询其 generation 状态
- 根据当前状态动态调整轮询间隔，优化性能
- 检测到状态变化时自动切换轮询频率
- 完成或失败时自动停止轮询

**相关文件**:
- `src/components/ProjectProgress.tsx`
- `src/hooks/useGenerationPolling.ts`

### 2. 完成回调（即时更新）

**触发时机**: 项目生成完成时

**执行操作**:
1. 立即刷新整个项目列表
2. 显示成功 Toast 通知用户
3. 更新项目状态和统计数据

**工作流程**:
```
Generation完成 → ProjectProgress检测到 → 调用onComplete回调 
→ handleProjectComplete → refreshProjects() + Toast提示
```

**相关代码**:
```typescript
// DashboardPage.tsx
const handleProjectComplete = async () => {
  await refreshProjects();
  setToast({ message: '项目生成完成！', type: 'success' });
};

// ProjectProgress组件
<ProjectProgress 
  generationId={project.generation.id}
  onComplete={handleProjectComplete}
/>
```

### 3. 全局列表轮询（兜底保障）

**组件**: `useProjects` hook

**轮询频率**: 每 **30 秒**

**触发条件**: 当检测到有进行中的项目时自动启动

**工作原理**:
- `useProjects` 维护 `hasProcessingProjects` 状态
- 当该状态为 `true` 时，启动定时器
- 定期刷新整个项目列表，确保数据同步
- 没有进行中的项目时自动停止轮询

**作用**:
- 作为备份机制，防止单个项目轮询失败
- 确保多个项目的状态保持同步
- 处理网络波动等异常情况

**相关代码**:
```typescript
// useProjects.ts
useEffect(() => {
  if (!hasProcessingProjects || !user) {
    return;
  }

  const pollInterval = setInterval(() => {
    fetchProjects(0, false);
  }, 30000); // 30秒

  return () => clearInterval(pollInterval);
}, [hasProcessingProjects, user, fetchProjects]);
```

## 🎨 用户体验优化

### 视觉指示器

在"我的项目"标题旁显示实时状态：

```typescript
{hasProcessingProjects && (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
    <span className="text-sm text-blue-700 font-medium">进行中</span>
  </div>
)}
```

### 进度条显示

每个进行中的项目卡片显示：
- 实时进度百分比
- 状态文本（排队中、准备中、生成中、即将完成）
- 动态颜色变化
- 旋转的时钟图标

### Toast 通知

项目完成时弹出友好提示：
- ✅ 成功消息："项目生成完成！"
- 自动消失
- 不打扰用户操作

## 🔄 状态流转

```
创建项目 → pending (10秒/次) → processing (3秒/次) → completed
                ↓                      ↓                    ↓
            排队中...              生成中...           停止轮询 + 刷新列表
```

## 📊 性能优化

### 智能轮询间隔

| 状态 | 轮询间隔 | 原因 |
|------|---------|------|
| pending | 10秒 | 排队等待，变化较慢 |
| processing | 3秒 | 正在处理，需要快速响应 |
| completed/failed | 停止 | 无需继续轮询 |

### 资源管理

- ✅ 完成/失败时自动停止轮询
- ✅ 组件卸载时清理定时器
- ✅ 没有进行中项目时停止全局轮询
- ✅ 避免重复请求和内存泄漏

### 网络优化

- 单个项目轮询只查询必要字段
- 全局轮询作为备份，频率较低（30秒）
- 使用 Supabase 的高效查询

## 🛠️ 技术实现

### 关键 Hooks

1. **useProjects**
   - 管理项目列表
   - 跟踪进行中项目数量
   - 提供刷新方法

2. **useGenerationPolling**
   - 轮询单个 generation 状态
   - 智能调整轮询频率
   - 状态变化时自动响应

3. **useAuth**
   - 提供用户认证信息
   - 确保只查询当前用户的项目

### 数据流

```
Supabase Database
      ↓
useProjects (列表级别)
      ↓
DashboardPage
      ↓
ProjectProgress (单项级别)
      ↓
useGenerationPolling
      ↓
实时状态更新
```

## 🧪 测试建议

### 场景测试

1. **单个项目完成**
   - 创建一个项目
   - 观察进度条更新
   - 验证完成后的 Toast 提示
   - 确认项目状态自动更新

2. **多个项目同时进行**
   - 创建多个项目
   - 验证每个项目独立轮询
   - 确认状态不会相互干扰

3. **网络异常**
   - 断开网络
   - 验证轮询继续尝试
   - 恢复网络后数据自动同步

4. **标签切换**
   - 在"所有项目"、"已完成"、"处理中"之间切换
   - 验证轮询不受影响
   - 确认项目完成后自动从"处理中"移除

## 📝 维护建议

### 调整轮询间隔

如需修改轮询频率，编辑以下位置：

```typescript
// useGenerationPolling.ts - 单项轮询
const interval = currentStatus === 'pending' ? 10000 : 3000;

// useProjects.ts - 全局轮询
const pollInterval = setInterval(() => {
  fetchProjects(0, false);
}, 30000); // 调整这个值
```

### 监控建议

- 监控 API 请求频率
- 跟踪平均完成时间
- 记录异常情况
- 收集用户反馈

## 🎯 总结

当前的轮询机制具有以下特点：

✅ **完整性**: 三层保障，不会漏掉任何状态变化  
✅ **实时性**: 最快3秒响应，用户体验流畅  
✅ **智能性**: 根据状态动态调整，节省资源  
✅ **健壮性**: 多重容错，处理异常情况  
✅ **用户友好**: 视觉反馈清晰，操作不受影响  

这是一个生产级的实现方案！ 🚀

