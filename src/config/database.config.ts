import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.NODE_MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  username: process.env.MYSQL_USERNAME || 'root',
  password: process.env.MYSQL_PASSWORD || '123456789',
  database: process.env.MYSQL_DATABASE || 'alkaline-backend-test',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production', // 非生产环境自动同步表结构
  logging: false, // 是否开启SQL日志输出，用于调试
  autoLoadEntities: true, // 自动加载实体
  charset: 'utf8mb4', // 支持emoji等特殊字符
  timezone: '+08:00', // 设置时区为东八区
  // 连接池配置
  extra: {
    connectionLimit: 10,
    connectTimeout: 60000,
  },
  // 重试配置
  retryAttempts: 3, // 重试次数
  retryDelay: 3000, // 重试延迟
};
