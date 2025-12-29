import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class GlobalResponseWrapperInterceptor implements NestInterceptor {
  constructor(@Inject('DEFAULT_SUCCESS_CODE') private readonly defaultSuccessCode: number) {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        return {
          code: this.defaultSuccessCode ?? 0,
          data: data ?? true,
          message: 'success',
        };
      }),
    );
  }
}
