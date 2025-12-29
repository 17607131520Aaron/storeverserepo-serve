import { REDIS_CONSTANTS } from '@/config/redis.config';

/**
 * Redis工具类
 * 提供常用的Redis操作和键管理功能
 */
export class RedisUtils {
  /**
   * 生成用户缓存键
   */
  public static getUserCacheKey(userId: string): string {
    return `${REDIS_CONSTANTS.KEY_PREFIXES.USER}${userId}`;
  }

  /**
   * 生成用户会话键
   */
  public static getUserSessionKey(userId: string): string {
    return `${REDIS_CONSTANTS.KEY_PREFIXES.SESSION}${userId}`;
  }

  /**
   * 生成缓存键
   */
  public static getCacheKey(prefix: string, identifier: string): string {
    return `${REDIS_CONSTANTS.KEY_PREFIXES.CACHE}${prefix}:${identifier}`;
  }

  /**
   * 生成分布式锁键
   */
  public static getLockKey(resource: string, identifier: string): string {
    return `${REDIS_CONSTANTS.KEY_PREFIXES.LOCK}${resource}:${identifier}`;
  }

  /**
   * 生成日志键
   */
  public static getLogKey(type: string, identifier: string): string {
    return `${REDIS_CONSTANTS.KEY_PREFIXES.LOG}${type}:${identifier}`;
  }

  /**
   * 生成标签键
   */
  public static getTagKey(type: string, identifier: string): string {
    return `${REDIS_CONSTANTS.KEY_PREFIXES.TAG}${type}:${identifier}`;
  }

  /**
   * 获取默认过期时间
   */
  public static getDefaultTTL(type: keyof typeof REDIS_CONSTANTS.DEFAULT_TTL): number {
    return REDIS_CONSTANTS.DEFAULT_TTL[type];
  }

  /**
   * 生成带过期时间的缓存键
   */
  public static getExpiringCacheKey(
    prefix: string,
    identifier: string,
    ttl: number = REDIS_CONSTANTS.DEFAULT_TTL.CACHE,
  ): { key: string; ttl: number } {
    return {
      key: this.getCacheKey(prefix, identifier),
      ttl,
    };
  }

  /**
   * 生成用户相关的所有键
   */
  public static getUserKeys(userId: string): {
    cache: string;
    session: string;
    logs: string;
    tags: string;
  } {
    return {
      cache: this.getUserCacheKey(userId),
      session: this.getUserSessionKey(userId),
      logs: this.getLogKey('user', userId),
      tags: this.getTagKey('user', userId),
    };
  }

  /**
   * 检查键是否匹配模式
   */
  public static isKeyMatch(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  /**
   * 获取键的命名空间
   */
  public static getKeyNamespace(key: string): string {
    const parts = key.split(':');
    return parts[0] || '';
  }

  /**
   * 生成批量操作的键数组
   */
  public static generateBatchKeys(prefix: string, identifiers: string[]): string[] {
    return identifiers.map((id) => `${prefix}:${id}`);
  }

  /**
   * 解析键获取标识符
   */
  public static parseKeyIdentifier(key: string): string | null {
    const parts = key.split(':');
    return parts.length > 1 ? parts[parts.length - 1] : null;
  }
}
