import {
  ExceptionFilter, // 异常过滤器接口
  Catch, // 捕获装饰器
  ArgumentsHost, // 请求上下文宿主
  HttpException, // HTTP 异常基类
  HttpStatus, // HTTP 状态码枚举
  Injectable, // 使类可注入的装饰器
  Inject, // 依赖注入标记
} from '@nestjs/common';
import { Response } from 'express'; // Express.Response 类型
import { AppHttpException, APP_ERROR_CODES } from '@/common/common-errors'; // 企业级错误定义与代码常量

@Injectable() // 将该类标注为可注入的服务
@Catch() // 捕获所有异常
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(@Inject('DEFAULT_ERROR_CODE') private readonly defaultErrorCode: number) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp(); // 将执行上下文切换到 HTTP 上下文
    const response = ctx.getResponse<Response>(); // 获取 Express 的响应对象
    const request = ctx.getRequest<Request>(); // 获取 Express 的请求对象

    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR; // 默认 HTTP 状态码
    let code: number; // 业务错误码
    let message: string = APP_ERROR_CODES.UNKNOWN_ERROR.message; // 默认错误信息

    if (exception instanceof AppHttpException) {
      // 如果是企业自定义异常
      code = exception.getCode(); // 使用自定义的错误码
      status = exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR; // 获取状态码
      message = exception.message ?? APP_ERROR_CODES.UNKNOWN_ERROR.message; // 使用异常信息或默认
    } else if (exception instanceof HttpException) {
      // 如果是 Nest 的 HttpException
      status = exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR; // 获取状态
      const exAny: unknown = exception; // 便于后续类型判断
      const hasGetCode = (ex: unknown): ex is { getCode: () => number } => {
        const candidate = ex as { getCode?: unknown };
        return typeof candidate.getCode === 'function'; // 是否具备 getCode 方法
      };
      code = hasGetCode(exAny)
        ? (exAny as { getCode: () => number }).getCode()
        : (this.defaultErrorCode ?? APP_ERROR_CODES.INTERNAL_ERROR.code);
      message = (exception as HttpException).message ?? APP_ERROR_CODES.INTERNAL_ERROR.message; // 统一消息
    } else {
      // 其他未知异常
      code = APP_ERROR_CODES.UNKNOWN_ERROR.code; // 未知错误码
      message = APP_ERROR_CODES.UNKNOWN_ERROR.message; // 未知错误信息
      status = HttpStatus.INTERNAL_SERVER_ERROR; // 服务器错误
    }

    response
      .status(status)
      .json({ code, data: null, message, path: request?.url, timestamp: new Date().toISOString() }); // 返回统一结构
  }
}
