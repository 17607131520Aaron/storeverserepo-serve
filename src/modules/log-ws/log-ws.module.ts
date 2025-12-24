import { Module } from '@nestjs/common';
import { LogWsGateway } from './log-ws.gateway';

@Module({
  providers: [LogWsGateway],
  exports: [LogWsGateway],
})
export class LogWsModule {}

