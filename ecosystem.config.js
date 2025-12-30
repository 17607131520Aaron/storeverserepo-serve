const fs = require('fs');
const path = require('path');

/**
 * 读取环境变量文件并解析为对象
 * @param {string} envFile - 环境变量文件路径
 * @returns {Object} 解析后的环境变量对象
 */
function loadEnvFile(envFile) {
  const env = {};
  if (!fs.existsSync(envFile)) {
    console.warn(`⚠️  环境变量文件不存在: ${envFile}`);
    return env;
  }

  const content = fs.readFileSync(envFile, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    // 跳过空行和注释
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    // 解析 KEY=VALUE 格式
    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // 移除引号
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }

  return env;
}

/**
 * 获取环境变量配置
 * @param {string} envName - 环境名称 (development/test/production)
 * @returns {Object} 环境变量对象
 */
function getEnvConfig(envName) {
  // 优先读取 .env.{envName} 文件
  const envFile = path.join(__dirname, `.env.${envName}`);
  const defaultEnvFile = path.join(__dirname, '.env');

  let env = {};

  // 先读取默认 .env 文件（如果存在）
  if (fs.existsSync(defaultEnvFile)) {
    env = { ...env, ...loadEnvFile(defaultEnvFile) };
  }

  // 再读取特定环境的 .env 文件（如果存在），会覆盖默认值
  if (fs.existsSync(envFile)) {
    env = { ...env, ...loadEnvFile(envFile) };
  }

  // 确保 NODE_ENV 设置正确
  env.NODE_ENV = envName;

  return env;
}

// 获取各环境的配置
const devEnv = getEnvConfig('development');
const testEnv = getEnvConfig('test');
const prodEnv = getEnvConfig('production');

module.exports = {
  apps: [
    {
      name: 'storeverserepo-serve',
      script: './dist/main.js',
      instances: 1, // 本地部署使用单实例，生产环境可以设置为 'max' 或具体数字
      exec_mode: 'fork', // 本地使用 fork 模式，生产环境可以使用 cluster
      watch: false, // 生产环境关闭文件监听
      max_memory_restart: '500M', // 内存超过 500M 自动重启

      // 开发环境配置（从 .env.development 或 .env 文件读取）
      env: {
        ...devEnv, // 先合并所有环境变量
        NODE_ENV: 'development', // 确保 NODE_ENV 正确
        SERVICE_PORT: devEnv.SERVICE_PORT || '3000', // 如果环境变量文件中没有，使用默认值
      },

      // 测试环境配置（从 .env.test 或 .env 文件读取）
      env_test: {
        ...testEnv, // 先合并所有环境变量
        NODE_ENV: 'test', // 确保 NODE_ENV 正确
        SERVICE_PORT: testEnv.SERVICE_PORT || '3001', // 如果环境变量文件中没有，使用默认值
      },

      // 生产环境配置（从 .env.production 或 .env 文件读取）
      env_production: {
        ...prodEnv, // 先合并所有环境变量
        NODE_ENV: 'production', // 确保 NODE_ENV 正确
        SERVICE_PORT: prodEnv.SERVICE_PORT || '3000', // 如果环境变量文件中没有，使用默认值
        instances: 'max', // 生产环境使用所有 CPU 核心
        exec_mode: 'cluster', // 生产环境使用集群模式
      },

      // 日志配置
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // 进程管理配置
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
    },
  ],
};
