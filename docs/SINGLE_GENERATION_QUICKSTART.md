# 单张生成历史记录功能 - 快速启动指南

## 🚀 快速开始

### 1. 数据库迁移（首次使用）

在 Supabase SQL Editor 中执行：

```sql
-- 复制并执行 database-migrations/add_single_generations.sql 的内容
```

或直接在 Supabase Dashboard 执行：

1. 登录 Supabase Dashboard
2. 选择项目
3. 点击左侧 "SQL Editor"
4. 点击 "New query"
5. 粘贴 `database-migrations/add_single_generations.sql` 的内容
6. 点击 "Run" 执行

### 2. 启动开发服务器

```bash
cd /Users/zhangyanhua/AI/ai-wedding
npm run dev
```

### 3. 测试功能

#### 步骤 1：生成图片
1. 访问：http://localhost:3000/generate-single
2. 登录（如未登录）
3. 上传照片
4. 输入提示词
5. 点击"生成图片"
6. 等待生成完成

#### 步骤 2：查看历史
1. 访问：http://localhost:3000/dashboard
2. 点击"单张生成"标签页
3. 查看刚才生成的记录

#### 步骤 3：测试操作
- 点击"查看详情"查看完整信息
- 点击"下载"下载结果图
- 点击"删除"删除记录

## 📁 文件结构

```
ai-wedding/
├── database-migrations/
│   └── add_single_generations.sql          # 数据库迁移文件
├── app/
│   ├── types/
│   │   └── database.ts                     # 添加了 SingleGeneration 类型
│   ├── hooks/
│   │   ├── useSingleGenerations.ts         # 新增：数据查询 Hook
│   │   └── useStreamImageGeneration.ts     # 修改：添加保存逻辑
│   ├── components/
│   │   ├── DashboardPage.tsx               # 修改：添加单张生成标签页
│   │   ├── SingleGenerationCard.tsx        # 新增：卡片组件
│   │   └── SingleGenerationDetailModal.tsx # 新增：详情模态框
└── docs/
    ├── SINGLE_GENERATION_HISTORY.md        # 功能文档
    ├── TESTING_SINGLE_GENERATION_HISTORY.md # 测试指南
    └── SINGLE_GENERATION_QUICKSTART.md     # 本文件
```

## ✅ 验证清单

### 数据库
- [ ] `single_generations` 表已创建
- [ ] 索引已创建
- [ ] RLS 策略已启用

### 前端
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 错误
- [ ] 开发服务器正常启动

### 功能
- [ ] 生成图片成功
- [ ] 自动保存到数据库
- [ ] Dashboard 显示历史记录
- [ ] 查看详情正常
- [ ] 下载功能正常
- [ ] 删除功能正常

## 🔍 快速验证命令

### 检查数据库表
```sql
-- 查看表结构
\d single_generations

-- 查看最新记录
SELECT 
  id, 
  LEFT(prompt, 50) as prompt_preview,
  credits_used,
  created_at 
FROM single_generations 
ORDER BY created_at DESC 
LIMIT 5;

-- 统计记录数
SELECT 
  COUNT(*) as total_records,
  SUM(credits_used) as total_credits
FROM single_generations;
```

### 检查代码质量
```bash
# TypeScript 检查
npm run typecheck

# ESLint 检查
npm run lint

# 构建测试
npm run build
```

## 🐛 常见问题

### 问题 1：数据库表不存在
**症状**：控制台显示 "relation 'single_generations' does not exist"

**解决**：
1. 确认已执行数据库迁移
2. 在 Supabase SQL Editor 中运行：
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'single_generations';
   ```
3. 如果返回空，重新执行迁移文件

### 问题 2：保存失败但不影响生成
**症状**：控制台显示 "保存生成记录到数据库失败（不影响主流程）"

**可能原因**：
- RLS 策略配置错误
- 用户未认证
- 网络问题

**解决**：
1. 检查 RLS 策略：
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'single_generations';
   ```
2. 确认用户已登录
3. 检查 Supabase 连接

### 问题 3：Dashboard 不显示记录
**症状**：标签页显示但列表为空

**检查**：
1. 确认已登录
2. 检查数据库中是否有记录：
   ```sql
   SELECT COUNT(*) FROM single_generations WHERE user_id = auth.uid();
   ```
3. 检查浏览器控制台错误
4. 刷新页面

### 问题 4：图片无法显示
**症状**：卡片或详情中图片显示失败

**可能原因**：
- MinIO URL 过期（24小时有效）
- 跨域问题
- 图片 URL 无效

**解决**：
1. 检查图片 URL 是否有效
2. 重新生成图片
3. 检查 MinIO 配置

## 📊 性能优化建议

### 当前实现
- 一次加载所有记录
- 适用于 < 100 条记录

### 未来优化（记录 > 100 时）
1. **分页加载**：
   ```typescript
   const { loadMore, hasMore } = useSingleGenerations({ pageSize: 20 });
   ```

2. **虚拟滚动**：
   - 使用 `react-window` 或 `react-virtual`
   - 只渲染可见区域的卡片

3. **图片懒加载**：
   - Next.js Image 组件已支持
   - 可调整 `loading="lazy"` 策略

## 🎯 下一步

功能已完成并可以使用。建议：

1. **测试**：按照 `TESTING_SINGLE_GENERATION_HISTORY.md` 进行完整测试
2. **监控**：关注数据库插入成功率和性能
3. **优化**：根据实际使用情况优化性能
4. **反馈**：收集用户反馈并改进

## 📚 相关文档

- [功能详细文档](./SINGLE_GENERATION_HISTORY.md)
- [测试指南](./TESTING_SINGLE_GENERATION_HISTORY.md)
- [单张生成功能说明](./GENERATE_SINGLE_FEATURE.md)
- [数据库架构](./database-schema.sql)

## 💡 提示

- 生成图片需要消耗 15 积分
- 图片会自动保存，无需手动操作
- 可以随时在 Dashboard 查看历史记录
- 删除记录不会退还积分
- 数据库保存失败不会影响图片生成

---

**祝使用愉快！** 🎉

如有问题，请查看详细文档或联系开发团队。

