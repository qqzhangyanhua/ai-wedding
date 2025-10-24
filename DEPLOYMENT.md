# 部署文档

## 问题诊断

如果遇到以下错误：
```
Error: ENOENT: no such file or directory, open '/opt/ai-wedding/ai-wedding/.next/prerender-manifest.json'
```

**原因**：项目未构建，或 `.next` 目录不存在。

## 解决方案

### 方法 1：使用自动化部署脚本（推荐）

在服务器的项目目录执行：

```bash
cd /opt/ai-wedding/ai-wedding

# 完整部署（包含构建）
bash scripts/deploy.sh

# 或使用 pnpm 脚本
pnpm run deploy
```

部署脚本会自动执行以下操作：
1. ✓ 检查并安装依赖
2. ✓ 清理并构建项目
3. ✓ 创建日志目录
4. ✓ 停止旧的 PM2 进程
5. ✓ 启动新的 PM2 进程
6. ✓ 保存 PM2 配置

### 方法 2：手动构建和启动

```bash
cd /opt/ai-wedding/ai-wedding

# 1. 安装依赖（首次部署）
pnpm install

# 2. 构建项目
pnpm run build

# 3. 创建日志目录
mkdir -p logs

# 4. 启动 PM2
pm2 start ecosystem.config.js

# 5. 保存配置
pm2 save

# 6. 设置开机自启（可选）
pm2 startup
```

### 方法 3：快速启动（已构建的情况）

如果项目已经构建过，只需要启动服务：

```bash
cd /opt/ai-wedding/ai-wedding

# 使用快速启动脚本
bash scripts/start-pm2.sh

# 或使用 pnpm 脚本
pnpm run pm2:start
```

## PM2 常用命令

### 使用 package.json 脚本（推荐）

```bash
pnpm run pm2:status    # 查看状态
pnpm run pm2:logs      # 查看日志
pnpm run pm2:restart   # 重启应用
pnpm run pm2:stop      # 停止应用
pnpm run deploy        # 完整部署
```

### 直接使用 PM2 命令

```bash
pm2 status             # 查看所有应用状态
pm2 logs ai-wedding    # 查看实时日志
pm2 logs ai-wedding --lines 100  # 查看最近100行日志
pm2 restart ai-wedding # 重启应用
pm2 stop ai-wedding    # 停止应用
pm2 delete ai-wedding  # 删除应用
pm2 save               # 保存当前进程列表
pm2 resurrect          # 恢复已保存的进程列表
```

## 环境变量配置

确保在服务器上配置了 `.env` 文件：

```bash
cd /opt/ai-wedding/ai-wedding
cp .env.example .env
vim .env  # 编辑环境变量
```

必需的环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `MINIO_ENDPOINT`
- `MINIO_PORT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_BUCKET_NAME`
- 等等...

## 日志文件位置

PM2 日志文件：
- 错误日志：`/opt/ai-wedding/ai-wedding/logs/pm2-error.log`
- 输出日志：`/opt/ai-wedding/ai-wedding/logs/pm2-out.log`

Next.js 构建输出：
- `.next/` 目录

## 故障排查

### 1. 构建失败

```bash
# 清理缓存重新构建
rm -rf .next node_modules/.cache
pnpm run build
```

### 2. PM2 启动失败

```bash
# 查看详细错误
pm2 logs ai-wedding --err

# 检查端口占用
lsof -i :8081

# 重置 PM2
pm2 kill
pm2 start ecosystem.config.js
```

### 3. 内存不足

如果服务器内存不足，构建时可能会失败：

```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm run build
```

或修改 `ecosystem.config.js` 中的 `max_memory_restart` 配置。

### 4. 权限问题

```bash
# 确保脚本有执行权限
chmod +x scripts/*.sh

# 确保日志目录有写入权限
chmod -R 755 logs
```

## 更新部署

当代码更新后重新部署：

```bash
cd /opt/ai-wedding/ai-wedding

# 1. 拉取最新代码
git pull

# 2. 运行部署脚本
pnpm run deploy

# 或分步执行
pnpm install  # 更新依赖
pnpm run build  # 重新构建
pnpm run pm2:restart  # 重启服务
```

## 开机自启动

设置 PM2 开机自启动：

```bash
# 生成启动脚本
pm2 startup

# 执行输出的命令（类似下面的格式）
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u yourusername --hp /home/yourusername

# 保存当前进程列表
pm2 save
```

## 监控和维护

### 性能监控

```bash
# PM2 自带监控
pm2 monit

# 或使用 PM2 Plus（需要注册）
pm2 plus
```

### 定期维护

```bash
# 清理 PM2 日志
pm2 flush

# 重载应用（零停机）
pm2 reload ai-wedding
```

## 生产环境检查清单

部署前确认：
- [ ] `.env` 文件已配置
- [ ] 所有依赖已安装 (`pnpm install`)
- [ ] 项目已构建 (`pnpm run build`)
- [ ] 构建文件存在 (`.next/prerender-manifest.json`)
- [ ] 日志目录已创建 (`logs/`)
- [ ] 端口 8081 未被占用
- [ ] PM2 已全局安装 (`pm2 -v`)
- [ ] 防火墙已开放 8081 端口（如需要）

## 技术支持

如遇问题，请检查：
1. PM2 日志：`pnpm run pm2:logs`
2. Next.js 构建输出
3. 系统资源使用情况：`top` 或 `htop`
4. 磁盘空间：`df -h`







