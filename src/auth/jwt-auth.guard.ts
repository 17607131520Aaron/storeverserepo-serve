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
    const authHeader = request.headers.authorization || request.headers.Authorization;
    if (typeof authHeader !== 'string') {
      return null;
    }
    const [scheme, token] = authHeader.split(' ');
    return scheme?.toLowerCase() === 'bearer' && token ? token : null;
  }

  private isSwaggerRequest(request: Request): boolean {
    const path = request.path || request.url || '';
    return path.startsWith('/api') || path.startsWith('/api-json');
  }
}

