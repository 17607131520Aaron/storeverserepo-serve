// 环境变量配置
export const envConfig = {
  // 数据库配置
  database: {
    host: process.env.NODE_MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  },
  // 应用配置
  app: {
    port: parseInt(process.env.SERVICE_PORT || '9000'),
    env: process.env.NODE_ENV || 'development',
  },
  // Redis配置
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    ttlSeconds: parseInt(process.env.JWT_TTL_SECONDS || '7200'),
  },
  // 微信配置
  wechat: {
    appId: process.env.WECHAT_APPID || '',
    secret: process.env.WECHAT_SECRET || '',
  },
};
