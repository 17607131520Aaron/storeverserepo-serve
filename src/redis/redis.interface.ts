import type Redis from 'ioredis';

// Redis服务接口
export interface IRedisService {
  // 获取Redis客户端实例
  getClient(): Redis;

  // 基础操作
  set(key: string, value: string | number | Buffer, ttl?: number): Promise<'OK'>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;

  // 哈希操作
  hset(key: string, field: string, value: string): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hdel(key: string, field: string): Promise<number>;
  hgetall(key: string): Promise<Record<string, string>>;

  // 列表操作
  lpush(key: string, value: string): Promise<number>;
  rpush(key: string, value: string): Promise<number>;
  lpop(key: string): Promise<string | null>;
  rpop(key: string): Promise<string | null>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;

  // 集合操作
  sadd(key: string, member: string): Promise<number>;
  srem(key: string, member: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  sismember(key: string, member: string): Promise<number>;

  // 有序集合操作
  zadd(key: string, score: number, member: string): Promise<number>;
  zrem(key: string, member: string): Promise<number>;
  zrange(key: string, start: number, stop: number): Promise<string[]>;
  zscore(key: string, member: string): Promise<string | null>;

  // 连接状态检查
  ping(): Promise<string>;
  isConnected(): boolean;
  getConnectionInfo(): Promise<{
    status: string;
    host: string;
    port: number;
    db: number;
    memory: Record<string, unknown>;
    info: Record<string, unknown>;
  }>;

  // 获取健康状态
  getHealthStatus(): boolean;

  // 获取Redis统计信息
  getStats(): Promise<Record<string, unknown>>;
}
