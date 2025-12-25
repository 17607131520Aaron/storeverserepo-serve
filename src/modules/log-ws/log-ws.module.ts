import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogWsGateway } from './log-ws.gateway';
import { NativeWsServer } from './native-ws.server';

@Module({
  providers: [LogWsGateway, NativeWsServer],
  exports: [LogWsGateway, NativeWsServer],
})
export class LogWsModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly nativeWsServer: NativeWsServer,
    private readonly configService: ConfigService,
  ) {}

  public onModuleInit(): void {
    // 获取日志服务器端口（默认 8082）
    const logServerPort = this.configService.get<number>('LOG_SERVER_PORT', 8082);
    // 启动原生 WebSocket 服务器
    this.nativeWsServer.start(logServerPort, '/logs');
  }

  public onModuleDestroy(): void {
    // 停止原生 WebSocket 服务器
    this.nativeWsServer.stop();
  }
}

