import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { REDIS_CONSTANTS } from '@/config/redis.config';
import type { IRedisService } from '@/redis/redis.interface';

export interface JwtPayload {
  sub: number;
  username: string;
}

export interface LoginToken {
  token: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('IRedisService') private readonly redisService: IRedisService,
  ) {}

  public async signUser(payload: JwtPayload): Promise<LoginToken> {
    const expiresIn = this.getTtlSeconds();
    const token = await this.jwtService.signAsync(payload, {
      secret: this.getSecret(),
      expiresIn,
    });

    await this.cacheToken(token, payload, expiresIn);
    return { token, expiresIn };
  }

  public async validateToken(token: string): Promise<JwtPayload> {
    try {
      // 验证JWT token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.getSecret(),
      });

      // 检查Redis中是否存在该token
      const sessionKey = this.getSessionKey(token);
      const exists = await this.redisService.exists(sessionKey);
      
      if (!exists) {
        // 记录日志以便调试
        console.warn('[Auth] Token not found in Redis:', {
          sessionKey: `${sessionKey.substring(0, 50)  }...`,
          userId: payload.sub,
          username: payload.username,
        });
        throw new UnauthorizedException('登录状态已过期，请重新登录');
      }

      return payload;
    } catch (error) {
      // 如果是已定义的UnauthorizedException，直接抛出
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      // 其他错误（JWT验证失败等）
      console.error('[Auth] Token validation failed:', {
        error: error instanceof Error ? error.message : String(error),
        tokenPreview: token.substring(0, 20) + '...',
      });
      throw new UnauthorizedException('无效的登录状态');
    }
  }

  public async revokeToken(token: string): Promise<void> {
    await this.redisService.del(this.getSessionKey(token));
  }

  private async cacheToken(token: string, payload: JwtPayload, ttl: number): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(token);
      const result = await this.redisService.set(
        sessionKey,
        JSON.stringify({ userId: payload.sub, username: payload.username }),
        ttl,
      );
      
      // 验证存储是否成功
      if (result !== 'OK') {
        console.error('[Auth] Failed to cache token in Redis:', {
          sessionKey: sessionKey.substring(0, 50) + '...',
          result,
        });
        throw new Error('Failed to cache token in Redis');
      }
      
      // 开发环境记录日志
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Token cached successfully:', {
          sessionKey: sessionKey.substring(0, 50) + '...',
          userId: payload.sub,
          ttl,
        });
      }
    } catch (error) {
      console.error('[Auth] Error caching token:', {
        error: error instanceof Error ? error.message : String(error),
        userId: payload.sub,
      });
      // 如果Redis存储失败，仍然抛出错误，避免返回无效token
      throw new Error(`Failed to cache token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getSessionKey(token: string): string {
    return `${REDIS_CONSTANTS.KEY_PREFIXES.SESSION}jwt:${token}`;
  }

  private getSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'dev-secret';
  }

  private getTtlSeconds(): number {
    const ttl = Number(this.configService.get<number>('JWT_TTL_SECONDS') ?? 7200);
    return Number.isFinite(ttl) && ttl > 0 ? ttl : 7200;
  }
}

