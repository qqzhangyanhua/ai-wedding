module.exports = {
    apps: [{
      name: "ai-image-generator",
      script: "npm",
      args: "start",
      cwd: "/opt/img-maked", // 明确指定工作目录
      env: {
        PORT: 8082,
        NODE_ENV: "production"
      }
    }]
  };