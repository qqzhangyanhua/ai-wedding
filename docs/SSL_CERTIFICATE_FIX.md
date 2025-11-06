# SSL 证书验证问题修复

## 问题描述

在调用图片识别 API (`/api/identify-image`) 时，出现间歇性的 SSL 证书验证失败错误：

```
Error: self-signed certificate in certificate chain
code: 'SELF_SIGNED_CERT_IN_CHAIN'
```

### 错误原因

1. **自签名证书**：目标 API 服务器使用了自签名的 SSL 证书
2. **间歇性失败**：可能是因为请求被路由到不同的服务器，部分服务器的证书配置有问题

## 解决方案

采用**方案 2**：使用环境变量控制 SSL 验证（推荐）

### 实现细节

#### 1. 修改 `app/api/identify-image/route.ts`

添加了以下功能：

- 读取环境变量 `DISABLE_SSL_VERIFY`
- 通过设置 `NODE_TLS_REJECT_UNAUTHORIZED` 环境变量来全局禁用 SSL 验证

**注意**：由于 Next.js 14 使用 `undici` 作为 fetch 实现，不支持传统的 `https.Agent` 方式，因此我们使用全局环境变量的方式。

```typescript
// 从环境变量读取是否禁用 SSL 验证（仅用于开发环境或信任的内网环境）
const DISABLE_SSL_VERIFY = process.env.DISABLE_SSL_VERIFY === 'true';

// 如果需要禁用 SSL 验证，设置全局环境变量
// 这会影响所有的 Node.js HTTPS 请求
if (DISABLE_SSL_VERIFY) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('[SSL] ⚠️ SSL 证书验证已全局禁用（仅用于开发环境）');
}
```

**重要说明**：这种方法会影响当前 Node.js 进程的所有 HTTPS 请求，而不仅仅是图片识别 API。因此，请务必仅在开发环境使用。

#### 2. 更新环境变量文件

在 `.env` 文件中添加：

```bash
# SSL 证书验证配置（仅用于开发环境或信任的内网环境）
# 设置为 true 可禁用 SSL 证书验证，解决自签名证书问题
# ⚠️ 警告：生产环境请勿启用此选项，会导致安全风险
DISABLE_SSL_VERIFY=true
```

在 `.env.example` 文件中添加（默认为 false）：

```bash
DISABLE_SSL_VERIFY=false
```

## 使用方法

### 开发环境

如果你的 API 服务器使用自签名证书，在 `.env` 文件中设置：

```bash
DISABLE_SSL_VERIFY=true
```

### 生产环境

⚠️ **强烈建议**：不要在生产环境禁用 SSL 验证！

生产环境应该：

1. 使用有效的 SSL 证书（如 Let's Encrypt）
2. 确保证书链完整
3. 保持 `DISABLE_SSL_VERIFY=false` 或不设置该变量

```bash
# 生产环境配置
DISABLE_SSL_VERIFY=false
```

## 安全警告

⚠️ **禁用 SSL 验证会带来安全风险**：

1. **中间人攻击**：攻击者可以拦截和修改你的请求
2. **数据泄露**：敏感信息可能被窃取
3. **身份伪造**：无法验证服务器的真实身份

**仅在以下情况使用**：

- 开发环境
- 完全信任的内网环境
- 临时测试

## 测试

重启开发服务器后测试：

```bash
# 重启服务器以加载新的环境变量
pnpm dev
```

然后上传图片进行识别，观察：

1. 是否还会出现 SSL 证书错误
2. 控制台是否输出 `[SSL] ⚠️ SSL 证书验证已禁用（仅用于开发环境）`

## 长期解决方案

对于生产环境，建议采用以下方案：

### 方案 1：使用有效的 SSL 证书

```bash
# 使用 Let's Encrypt 获取免费证书
certbot certonly --standalone -d your-api-domain.com
```

### 方案 2：配置证书链

确保 API 服务器配置了完整的证书链：

```nginx
ssl_certificate /path/to/fullchain.pem;
ssl_certificate_key /path/to/privkey.pem;
```

### 方案 3：添加自签名 CA 到系统信任列表

如果必须使用自签名证书（内网环境），将 CA 证书添加到系统信任列表。

## 相关文件

- `app/api/identify-image/route.ts` - 图片识别 API 路由
- `.env` - 环境变量配置
- `.env.example` - 环境变量示例

## 修复日期

2025-11-06

