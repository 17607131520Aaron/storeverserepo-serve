import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { IRedisService } from './redis.interface';
import { redisConfig, redisHealthConfig } from '@/config/redis.config';

@Injectable()
export class RedisServiceImpl implements IRedisService, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisServiceImpl.name);
  private redisClient: Redis;
  private healthCheckInterval: NodeJS.Timeout;
  private isHealthy = false;

  constructor() {
    this.redisClient = new Redis(redisConfig);
    this.setupEventListeners();
  }

  // 公共方法 - 按照接口要求实现
  public async onModuleInit(): Promise<void> {
    try {
      // 等待连接建立
      await this.redisClient.ping();
      this.isHealthy = true;
      this.logger.log('✅ Redis连接成功！');
      this.logger.log(`🌐 连接地址: ${redisConfig.host}:${redisConfig.port}`);
      this.logger.log(`🗄️ 数据库: ${redisConfig.db}`);

      // 启动健康检查
      this.startHealthCheck();

      // 获取连接信息
      const connectionInfo = await this.getConnectionInfo();
      this.logger.log(`📊 连接状态: ${connectionInfo.status}`);
    } catch (error) {
      this.logger.error('❌ Redis连接失败:', error.message);
      this.isHealthy = false;
    }
  }

  public async onModuleDestroy(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('🔌 Redis连接已关闭');
    }
  }

  // 获取Redis客户端实例
  public getClient(): Redis {
    return this.redisClient;
  }

  // 基础操作
  public async set(key: string, value: string | number | Buffer, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return await this.redisClient.setex(key, ttl, value);
    }
    return await this.redisClient.set(key, value);
  }

  public async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  public async del(key: string): Promise<number> {
    return await this.redisClient.del(key);
  }

  public async exists(key: string): Promise<number> {
    return await this.redisClient.exists(key);
  }

  public async expire(key: string, seconds: number): Promise<number> {
    return await this.redisClient.expire(key, seconds);
  }

  public async ttl(key: string): Promise<number> {
    return await this.redisClient.ttl(key);
  }

  // 哈希操作
  public async hset(key: string, field: string, value: string): Promise<number> {
    return await this.redisClient.hset(key, field, value);
  }

  public async hget(key: string, field: string): Promise<string | null> {
    return await this.redisClient.hget(key, field);
  }

  public async hdel(key: string, field: string): Promise<number> {
    return await this.redisClient.hdel(key, field);
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    return await this.redisClient.hgetall(key);
  }

  // 列表操作
  public async lpush(key: string, value: string): Promise<number> {
    return await this.redisClient.lpush(key, value);
  }

  public async rpush(key: string, value: string): Promise<number> {
    return await this.redisClient.rpush(key, value);
  }

  public async lpop(key: string): Promise<string | null> {
    return await this.redisClient.lpop(key);
  }

  public async rpop(key: string): Promise<string | null> {
    return await this.redisClient.rpop(key);
  }

  public async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.redisClient.lrange(key, start, stop);
  }

  // 集合操作
  public async sadd(key: string, member: string): Promise<number> {
    return await this.redisClient.sadd(key, member);
  }

  public async srem(key: string, member: string): Promise<number> {
    return await this.redisClient.srem(key, member);
  }

  public async smembers(key: string): Promise<string[]> {
    return await this.redisClient.smembers(key);
  }

  public async sismember(key: string, member: string): Promise<number> {
    return await this.redisClient.sismember(key, member);
  }

  // 有序集合操作
  public async zadd(key: string, score: number, member: string): Promise<number> {
    return await this.redisClient.zadd(key, score, member);
  }

  public async zrem(key: string, member: string): Promise<number> {
    return await this.redisClient.zrem(key, member);
  }

  public async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.redisClient.zrange(key, start, stop);
  }

  public async zscore(key: string, member: string): Promise<string | null> {
    return await this.redisClient.zscore(key, member);
  }

  // 连接状态检查
  public async ping(): Promise<string> {
    return await this.redisClient.ping();
  }

  public isConnected(): boolean {
    return this.redisClient.status === 'ready' && this.isHealthy;
  }

  public async getConnectionInfo(): Promise<{
    status: string;
    host: string;
    port: number;
    db: number;
    memory: Record<string, unknown>;
    info: Record<string, unknown>;
  }> {
    try {
      const [memory, info] = await Promise.all([
        this.redisClient.memory('STATS'),
        this.redisClient.info(),
      ]);

      // 解析info信息
      const infoLines = info.split('\r\n');
      const infoObj: Record<string, unknown> = {};

      infoLines.forEach((line) => {
        if (line && !line.startsWith('#') && line.includes(':')) {
          const [key, value] = line.split(':');
          infoObj[key] = value;
        }
      });

      return {
        status: this.redisClient.status,
        host: redisConfig.host,
        port: redisConfig.port,
        db: redisConfig.db,
        memory: { usage: memory },
        info: infoObj,
      };
    } catch (error) {
      this.logger.error('获取连接信息失败:', error.message);
      return {
        status: this.redisClient.status,
        host: redisConfig.host,
        port: redisConfig.port,
        db: redisConfig.db,
        memory: {},
        info: {},
      };
    }
  }

  // 获取健康状态
  public getHealthStatus(): boolean {
    return this.isHealthy;
  }

  // 获取Redis统计信息
  public async getStats(): Promise<Record<string, unknown>> {
    try {
      const info = await this.redisClient.info();
      const lines = info.split('\r\n');
      const stats: Record<string, unknown> = {};

      lines.forEach((line) => {
        if (line && !line.startsWith('#') && line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key] = value;
        }
      });

      return stats;
    } catch (error) {
      this.logger.error('获取统计信息失败:', error.message);
      return {};
    }
  }

  // 私有方法
  private setupEventListeners(): void {
    // 连接事件监听
    this.redisClient.on('connect', () => {
      this.logger.log('🔗 Redis正在连接...');
    });

    this.redisClient.on('ready', () => {
      this.logger.log('✅ Redis连接就绪');
      this.isHealthy = true;
    });

    this.redisClient.on('error', (error) => {
      this.logger.error('❌ Redis连接错误:', error.message);
      this.isHealthy = false;
    });

    this.redisClient.on('close', () => {
      this.logger.warn('⚠️ Redis连接已关闭');
      this.isHealthy = false;
    });

    this.redisClient.on('reconnecting', () => {
      this.logger.log('🔄 Redis正在重连...');
    });

    this.redisClient.on('end', () => {
      this.logger.warn('🔚 Redis连接已结束');
      this.isHealthy = false;
    });
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.ping();
        if (!this.isHealthy) {
          this.isHealthy = true;
          this.logger.log('✅ Redis健康检查通过');
        }
      } catch (error) {
        this.isHealthy = false;
        this.logger.error('❌ Redis健康检查失败:', error.message);
      }
    }, redisHealthConfig.checkInterval);
  }
}
