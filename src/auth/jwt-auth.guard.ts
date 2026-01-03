import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (this.isSwaggerRequest(request)) {
      return true;
    }

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('缺少认证令牌');
    }

    const payload = await this.authService.validateToken(token);
    // 将解析后的用户信息挂载到请求对象，便于后续使用
    (request as Request & { user?: unknown }).user = payload;
    return true;
  }

  private extractToken(request: Request): string | null {
    // 优先使用小写的 authorization，如果不存在则使用大写的 Authorization
    let authHeader = request.headers.authorization || request.headers.Authorization;
    
    // 如果 header 是数组，取第一个元素
    if (Array.isArray(authHeader)) {
      authHeader = authHeader[0];
    }
    
    if (typeof authHeader !== 'string' || !authHeader) {
      return null;
    }

    // 处理多个 token 的情况（例如：Bearer token1, Bearer token2）
    // 先按逗号分割，然后取第一个有效的 Bearer token
    const parts = authHeader.split(',').map(part => part.trim());
    
    for (const part of parts) {
      const [scheme, token] = part.split(' ');
      if (scheme?.toLowerCase() === 'bearer' && token) {
        // 移除 token 末尾可能存在的逗号
        return token.replace(/,$/, '');
      }
    }
    
    return null;
  }

  private isSwaggerRequest(request: Request): boolean {
    const path = request.path || request.url || '';
    return path.startsWith('/api') || path.startsWith('/api-json');
  }
}

