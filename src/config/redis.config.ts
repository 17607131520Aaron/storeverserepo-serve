import { envConfig } from './env.config';

// Redis连接配置
export const redisConfig = {
  host: envConfig.redis.host || 'localhost',
  port: envConfig.redis.port || 6379,
  password: envConfig.redis.password,
  db: envConfig.redis.db || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  // 集群配置（如果需要）
  enableReadyCheck: true,
  maxLoadingTimeout: 10000,
  // 重连配置
  retryDelayOnClusterDown: 300,
};

// Redis健康检查配置
export const redisHealthConfig = {
  checkInterval: 30000, // 30秒检查一次
  timeout: 5000, // 5秒超时
  maxRetries: 3, // 最大重试次数
};

// Redis常量配置
export const REDIS_CONSTANTS = {
  // 键前缀
  KEY_PREFIXES: {
    USER: 'user:',
    SESSION: 'session:',
    CACHE: 'cache:',
    LOCK: 'lock:',
    LOG: 'log:',
    TAG: 'tag:',
  },

  // 默认过期时间（秒）
  DEFAULT_TTL: {
    USER_CACHE: 3600, // 1小时
    SESSION: 7200, // 2小时
    CACHE: 1800, // 30分钟
    LOCK: 300, // 5分钟
    LOG: 86400, // 24小时
  },

  // 连接状态
  STATUS: {
    CONNECTING: 'connecting',
    READY: 'ready',
    ERROR: 'error',
    CLOSED: 'closed',
    RECONNECTING: 'reconnecting',
  },
} as const;
