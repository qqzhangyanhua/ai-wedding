# 系统公告功能文档

## 功能概述

系统公告功能允许管理员在首页顶部显示固定的通知条，用于发布重要信息、活动通知或系统维护公告。

## 功能特性

### 前台展示
- ✅ 页面顶部固定通知条
- ✅ 美观的渐变背景（navy 到 forest）
- ✅ 显示公告内容和发布日期
- ✅ 支持用户关闭（关闭后24小时内不再显示）
- ✅ 响应式设计，适配移动端
- ✅ 优雅降级（无公告时不显示）

### 后台管理
- ✅ 管理员专属权限
- ✅ 创建/编辑/删除公告
- ✅ 实时开关公告显示
- ✅ 自定义发布日期
- ✅ 历史公告列表查看

## 技术实现

### 1. 数据库层

#### 表结构
文件：`database-migrations/create-system-announcements.sql`

```sql
CREATE TABLE public.system_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  is_active boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### RLS 策略
- 所有用户（包括未认证用户/anon 角色）可以查看激活的公告（is_active = true）
- 管理员可以查看/创建/更新/删除所有公告

**重要说明**：必须在策略中明确指定 `TO anon, authenticated` 才能允许未登录用户访问，这是因为前端使用 anon key 调用 API。

### 2. 类型定义

文件：`app/types/database.ts`

```typescript
export interface SystemAnnouncement {
  id: string;
  content: string;
  is_active: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}
```

### 3. API 路由

#### 管理员 API
文件：`app/api/admin/announcements/route.ts`

- `GET /api/admin/announcements` - 获取所有公告
- `POST /api/admin/announcements` - 创建新公告
- `PUT /api/admin/announcements` - 更新公告
- `DELETE /api/admin/announcements?id={id}` - 删除公告

#### 公共 API
文件：`app/api/announcements/route.ts`

- `GET /api/announcements` - 获取当前激活的公告（单条）

### 4. 前端组件

#### AnnouncementBanner 组件
文件：`app/components/AnnouncementBanner.tsx`

公告横幅展示组件，集成在主布局中：
- 自动获取和显示激活的公告
- 支持用户关闭功能
- 使用 localStorage 存储关闭状态
- 24小时后重新显示

#### useAnnouncement Hook
文件：`app/hooks/useAnnouncement.ts`

公告数据管理 Hook：
- 从 API 获取公告数据
- 管理公告可见性状态
- 处理关闭操作和本地存储

#### 管理后台页面
文件：`app/admin/announcements/page.tsx`

管理员公告管理界面：
- 创建/编辑公告表单
- 实时开关显示状态
- 历史公告列表
- 删除功能

### 5. 集成位置

#### 主布局
文件：`app/layout.tsx`

公告横幅显示在 `HeaderBridge` 下方，全站可见。

#### 管理后台导航
文件：`app/components/admin/AdminLayout.tsx`

在管理后台侧边栏添加"系统公告"导航项。

## 使用指南

### 数据库初始化

1. 在 Supabase 控制台的 SQL Editor 中执行：
   ```bash
   database-migrations/create-system-announcements.sql
   ```

2. 如果已经执行过旧版本，需要修复 RLS 策略：
   ```bash
   database-migrations/fix-announcements-rls.sql
   ```

3. 验证表和策略创建成功：
   ```sql
   -- 查看表数据
   SELECT * FROM system_announcements;
   
   -- 查看 RLS 策略
   SELECT policyname, roles::text, cmd, qual 
   FROM pg_policies 
   WHERE tablename = 'system_announcements';
   ```

### 管理员操作

1. 访问管理后台：`/admin/announcements`

2. 创建新公告：
   - 输入公告内容（建议100字以内）
   - 勾选"立即显示公告"开关
   - 选择发布日期
   - 点击"创建公告"

3. 编辑公告：
   - 在历史公告列表中点击"编辑"
   - 修改内容、开关状态或发布日期
   - 点击"更新公告"

4. 删除公告：
   - 点击"删除公告"按钮
   - 确认删除操作

### 用户体验

1. 访问网站首页，公告自动显示在顶部
2. 点击右侧 ✕ 按钮可关闭公告
3. 关闭后24小时内不会再显示该公告
4. 24小时后或有新公告时会重新显示

## 样式说明

### 配色方案
- 背景：渐变色 `from-navy via-forest to-navy`
- 文字：`ivory` (象牙白)
- 图标：`rose-gold` (玫瑰金)
- 边框：`rose-gold/20` (半透明玫瑰金)

### 响应式设计
- 移动端：堆叠布局，公告内容和日期垂直排列
- 桌面端：水平布局，内容和日期在同一行

## 安全考虑

1. **权限控制**：使用 `requireAdmin` 中间件确保只有管理员可以管理公告
2. **RLS 策略**：数据库层面限制用户只能查看激活的公告
3. **内容验证**：API 层验证公告内容不为空
4. **XSS 防护**：公告内容作为纯文本展示，不解析 HTML

## 扩展建议

如需扩展功能，可考虑：

1. **富文本编辑**：集成 TipTap 或 Quill 编辑器支持格式化内容
2. **多条公告轮播**：支持同时显示多条公告，自动轮播
3. **公告分类**：添加公告类型（通知、维护、活动等）
4. **目标受众**：支持针对特定用户群体显示不同公告
5. **有效期设置**：添加公告过期时间，自动失效
6. **点击统计**：记录用户点击和关闭行为

## 故障排查

### 公告不显示

1. 检查数据库中是否有 `is_active = true` 的公告
   ```sql
   SELECT * FROM system_announcements WHERE is_active = true;
   ```

2. 检查 RLS 策略是否正确配置
   ```sql
   -- 应该看到 "Public can view active announcements" 策略
   -- roles 列应该包含 {anon,authenticated}
   SELECT policyname, roles::text, cmd, qual 
   FROM pg_policies 
   WHERE tablename = 'system_announcements';
   ```

3. 如果策略不正确，执行修复脚本：
   ```bash
   database-migrations/fix-announcements-rls.sql
   ```

4. 检查浏览器控制台是否有 API 错误

5. 检查 localStorage 中的 `announcement_dismissed` 项

6. 清除浏览器缓存和 localStorage

### 管理后台无法访问

1. 确认当前用户具有 admin 角色
2. 检查 Supabase RLS 策略是否正确配置
3. 查看浏览器控制台和网络请求错误

### API 错误

1. 验证 Supabase 环境变量配置正确
2. 检查数据库连接状态
3. 查看 API 路由日志

## 更新日志

### v1.0.0 (2025-01-05)
- ✅ 初始版本发布
- ✅ 基础公告显示功能
- ✅ 管理后台完整实现
- ✅ 用户关闭状态管理
- ✅ 响应式设计支持

## 相关文件

```
database-migrations/
  └── create-system-announcements.sql   # 数据库迁移脚本

app/
  ├── types/
  │   └── database.ts                   # 类型定义
  ├── api/
  │   ├── announcements/
  │   │   └── route.ts                  # 公共 API
  │   └── admin/
  │       └── announcements/
  │           └── route.ts              # 管理员 API
  ├── hooks/
  │   └── useAnnouncement.ts            # 公告 Hook
  ├── components/
  │   ├── AnnouncementBanner.tsx        # 公告横幅组件
  │   └── admin/
  │       └── AdminLayout.tsx           # 管理后台布局
  ├── admin/
  │   └── announcements/
  │       └── page.tsx                  # 管理后台页面
  └── layout.tsx                        # 主布局（集成公告横幅）
```

## 技术栈

- **前端框架**：Next.js 14 (App Router)
- **UI 库**：React 18
- **样式**：TailwindCSS
- **数据库**：Supabase (PostgreSQL)
- **身份验证**：Supabase Auth
- **类型检查**：TypeScript 5

## 维护建议

1. 定期清理过期的历史公告（保留最近30条即可）
2. 监控公告 API 的请求频率和性能
3. 收集用户反馈，优化公告内容和显示时机
4. 定期审查公告内容的准确性和相关性

