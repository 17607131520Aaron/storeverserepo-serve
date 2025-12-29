import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { IRedisService } from './redis.interface';

@ApiTags('Redis管理')
@Controller('redis')
export class RedisController {
  constructor(@Inject('IRedisService') private readonly redisService: IRedisService) {}

  @Get('health')
  @ApiOperation({ summary: 'Redis健康检查', description: '检查Redis连接状态' })
  @ApiResponse({ status: 200, description: '健康检查成功' })
  @ApiResponse({ status: 503, description: 'Redis服务不可用' })
  public async checkHealth(): Promise<{
    status: string;
    message: string;
    timestamp: string;
    ping: string;
  }> {
    const isConnected = this.redisService.isConnected();
    const ping = await this.redisService.ping();

    if (isConnected && ping === 'PONG') {
      return {
        status: 'healthy',
        message: 'Redis服务正常运行',
        timestamp: new Date().toISOString(),
        ping: ping,
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'Redis服务异常',
        timestamp: new Date().toISOString(),
        ping: ping,
      };
    }
  }

  @Get('status')
  @ApiOperation({ summary: '获取Redis连接状态', description: '获取详细的Redis连接信息' })
  @ApiResponse({ status: 200, description: '获取状态成功' })
  public async getStatus(): Promise<{
    connection: {
      status: string;
      host: string;
      port: number;
      db: number;
      memory: Record<string, unknown>;
      info: Record<string, unknown>;
    };
    statistics: Record<string, unknown>;
    timestamp: string;
  }> {
    const connectionInfo = await this.redisService.getConnectionInfo();
    const stats = await this.redisService.getStats();

    return {
      connection: connectionInfo,
      statistics: stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('info')
  @ApiOperation({ summary: '获取Redis信息', description: '获取Redis服务器详细信息' })
  @ApiResponse({ status: 200, description: '获取信息成功' })
  public async getInfo(): Promise<{
    info: Record<string, unknown>;
    timestamp: string;
  }> {
    const stats = await this.redisService.getStats();
    return {
      info: stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('test')
  @ApiOperation({ summary: '测试Redis操作', description: '测试基本的Redis读写操作' })
  @ApiResponse({ status: 200, description: '测试成功' })
  public async testRedis(@Body() body: { key: string; value: string; ttl?: number }): Promise<{
    success: boolean;
    message: string;
    data?: {
      key: string;
      writtenValue: string;
      readValue: string | null;
      exists: boolean;
      ttl: number | string;
    };
    error?: string;
    timestamp: string;
  }> {
    const { key, value, ttl } = body;

    try {
      // 写入测试
      await this.redisService.set(key, value, ttl);

      // 读取测试
      const readValue = await this.redisService.get(key);

      // 检查是否存在
      const exists = await this.redisService.exists(key);

      // 获取TTL
      const remainingTtl = await this.redisService.ttl(key);

      return {
        success: true,
        message: 'Redis操作测试成功',
        data: {
          key,
          writtenValue: value,
          readValue,
          exists: exists === 1,
          ttl: remainingTtl > 0 ? remainingTtl : '无过期时间',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Redis操作测试失败',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('keys/:pattern')
  @ApiOperation({ summary: '查询Redis键', description: '根据模式查询Redis中的键' })
  @ApiParam({ name: 'pattern', description: '键模式，支持通配符', example: '*' })
  @ApiResponse({ status: 200, description: '查询成功' })
  public async getKeys(@Param('pattern') pattern: string): Promise<{
    success: boolean;
    pattern: string;
    count: number;
    keys: string[];
    message?: string;
    error?: string;
    timestamp: string;
  }> {
    try {
      const client = this.redisService.getClient();
      const keys = await client.keys(pattern);

      return {
        success: true,
        pattern,
        count: keys.length,
        keys: keys.slice(0, 100), // 限制返回数量
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        pattern,
        count: 0,
        keys: [],
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Delete('keys/:key')
  @ApiOperation({ summary: '删除Redis键', description: '删除指定的Redis键' })
  @ApiParam({ name: 'key', description: '要删除的键名' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @HttpCode(HttpStatus.OK)
  public async deleteKey(@Param('key') key: string): Promise<{
    success: boolean;
    message: string;
    key: string;
    deleted: boolean;
    error?: string;
    timestamp: string;
  }> {
    try {
      const result = await this.redisService.del(key);

      return {
        success: true,
        message: result > 0 ? '键删除成功' : '键不存在',
        key,
        deleted: result > 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: '删除键失败',
        key,
        deleted: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('memory')
  @ApiOperation({ summary: '获取Redis内存使用情况', description: '获取Redis服务器的内存使用统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  public async getMemoryUsage(): Promise<{
    success: boolean;
    memoryUsage: unknown[];
    memoryInfo: Record<string, string>;
    message?: string;
    error?: string;
    timestamp: string;
  }> {
    try {
      const client = this.redisService.getClient();
      const memory = await client.memory('STATS');
      const info = await client.info('memory');

      // 解析内存信息
      const memoryLines = info.split('\r\n');
      const memoryInfo: Record<string, string> = {};

      memoryLines.forEach((line) => {
        if (line && !line.startsWith('#') && line.includes(':')) {
          const [key, value] = line.split(':');
          memoryInfo[key] = value;
        }
      });

      return {
        success: true,
        memoryUsage: memory,
        memoryInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        memoryUsage: [],
        memoryInfo: {},
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
