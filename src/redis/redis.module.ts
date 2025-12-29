import { Module, Global } from '@nestjs/common';
import { RedisServiceImpl } from './redis.service';
import { RedisController } from './redis.controller';

/**
 * Redis模块
 * 提供Redis连接、操作和监控功能
 * 设置为全局模块，其他模块可以直接注入使用
 */
@Global()
@Module({
  controllers: [RedisController],
  providers: [
    {
      provide: 'IRedisService',
      useClass: RedisServiceImpl,
    },
  ],
  exports: ['IRedisService'],
})
export class RedisModule {}
