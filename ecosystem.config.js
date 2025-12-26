module.exports = {
  apps: [
    {
      name: 'storeverserepo-serve',
      script: './dist/main.js',
      instances: 1, // 本地部署使用单实例，生产环境可以设置为 'max' 或具体数字
      exec_mode: 'fork', // 本地使用 fork 模式，生产环境可以使用 cluster
      watch: false, // 生产环境关闭文件监听
      max_memory_restart: '500M', // 内存超过 500M 自动重启
      env: {
        NODE_ENV: 'development',
        SERVICE_PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        SERVICE_PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      // 如果使用环境变量文件，可以取消注释下面这行
      // env_file: '.env',
    },
  ],
};

