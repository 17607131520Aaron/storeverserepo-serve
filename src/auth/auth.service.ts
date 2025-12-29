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
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.getSecret(),
      });

      const exists = await this.redisService.exists(this.getSessionKey(token));
      if (!exists) {
        throw new UnauthorizedException('登录状态已过期，请重新登录');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('无效的登录状态');
    }
  }

  public async revokeToken(token: string): Promise<void> {
    await this.redisService.del(this.getSessionKey(token));
  }

  private async cacheToken(token: string, payload: JwtPayload, ttl: number): Promise<void> {
    await this.redisService.set(
      this.getSessionKey(token),
      JSON.stringify({ userId: payload.sub, username: payload.username }),
      ttl,
    );
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

