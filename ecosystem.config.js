module.exports = {
  apps: [{
    name: "ai-wedding",
    script: "pnpm",
    args: "start",
    cwd: "/opt/ai-wedding/ai-wedding", // 明确指定工作目录
    env: {
      PORT: 8081,
      NODE_ENV: "production"
    },
    // PM2 相关配置
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    // 日志配置
    error_file: "/opt/ai-wedding/ai-wedding/logs/pm2-error.log",
    out_file: "/opt/ai-wedding/ai-wedding/logs/pm2-out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true
  }]
};