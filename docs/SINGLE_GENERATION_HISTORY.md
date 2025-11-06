# 单张生成历史记录功能

## 功能概述

为单张生成功能（`/generate-single`）添加了数据库持久化和历史记录展示功能。用户生成的每张图片都会自动保存到数据库，并可以在 Dashboard 的"单张生成"标签页中查看历史记录。

## 主要特性

### 1. 自动保存
- 生成成功后自动保存到数据库
- 后端静默执行，不影响用户体验
- 保存失败不会中断生成流程

### 2. 历史记录展示
- Dashboard 新增"单张生成"标签页
- 展示提示词、原图和结果图
- 支持查看详情、下载和删除操作

### 3. 数据完整性
- 记录提示词、原图、结果图
- 保存生成设置（五官保持强度、创意程度）
- 记录消耗的积分和创建时间

## 技术实现

### 数据库设计

创建了 `single_generations` 表：

```sql
CREATE TABLE single_generations (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  prompt text NOT NULL,
  original_image text NOT NULL,
  result_image text NOT NULL,
  settings jsonb DEFAULT '{}',
  credits_used integer DEFAULT 15,
  created_at timestamptz DEFAULT now()
);
```

### 核心文件

**新增文件：**
- `database-migrations/add_single_generations.sql` - 数据库迁移文件
- `app/hooks/useSingleGenerations.ts` - 数据查询 Hook
- `app/components/SingleGenerationCard.tsx` - 卡片组件
- `app/components/SingleGenerationDetailModal.tsx` - 详情模态框

**修改文件：**
- `app/types/database.ts` - 添加 `SingleGeneration` 类型
- `app/hooks/useStreamImageGeneration.ts` - 添加数据库保存逻辑
- `app/components/DashboardPage.tsx` - 添加单张生成标签页

### 数据流程

1. **生成阶段**：
   - 用户在 `/generate-single` 页面上传图片并输入提示词
   - 调用 API 生成图片
   - 流式接收生成结果

2. **保存阶段**：
   - 生成完成后上传到 MinIO
   - 静默保存到 `single_generations` 表
   - 保存失败不影响主流程

3. **展示阶段**：
   - 用户访问 Dashboard
   - 切换到"单张生成"标签页
   - 查询并展示历史记录

## 用户界面

### Dashboard 标签页

- **所有项目**：显示所有项目（原有功能）
- **已完成**：显示已完成的项目（原有功能）
- **单张生成**：显示单张生成历史记录（新增）

### 单张生成卡片

布局：
- 顶部：提示词（截断显示，hover 展开）
- 中间：原图和结果图并排展示
- 底部：创建时间、消耗积分、操作按钮

操作：
- 查看详情：打开详情模态框
- 下载：下载结果图
- 删除：删除历史记录

### 详情模态框

左侧：
- 完整提示词
- 生成设置（五官保持强度、创意程度）
- 其他信息（时间、积分）
- 下载按钮

右侧：
- 原图/结果图切换查看
- 大图预览
- 对比缩略图

## 使用说明

### 数据库迁移

在 Supabase SQL Editor 中执行：

```bash
# 执行迁移文件
database-migrations/add_single_generations.sql
```

### 开发环境测试

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问单张生成页面：
   ```
   http://localhost:3000/generate-single
   ```

3. 上传图片并生成

4. 访问 Dashboard 查看历史记录：
   ```
   http://localhost:3000/dashboard
   ```

5. 切换到"单张生成"标签页

### 验证清单

- [ ] 生成图片后自动保存到数据库
- [ ] Dashboard 显示"单张生成"标签页
- [ ] 历史记录正确展示（提示词、原图、结果图）
- [ ] 查看详情功能正常
- [ ] 下载功能正常
- [ ] 删除功能正常
- [ ] 数据库保存失败不影响生成流程

## 注意事项

1. **权限控制**：RLS 策略确保用户只能查看自己的记录
2. **错误处理**：数据库保存失败会记录日志但不抛出错误
3. **性能优化**：添加了数据库索引 `(user_id, created_at DESC)`
4. **图片存储**：result_image 使用 MinIO 的预签名 URL（24小时有效）
5. **积分一致性**：每次生成消耗 15 积分

## 后续优化建议

1. **分页加载**：当历史记录较多时支持分页
2. **搜索过滤**：支持按提示词搜索
3. **批量操作**：支持批量下载或删除
4. **图片对比**：添加滑动对比功能
5. **导出功能**：支持导出历史记录为 CSV
6. **统计分析**：添加使用统计和趋势分析

## 相关文档

- [单张生成功能说明](./GENERATE_SINGLE_FEATURE.md)
- [数据库架构](./database-schema.sql)
- [Dashboard 功能说明](./DASHBOARD_FEATURES.md)

