import { Module, Global } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { rabbitmqConfig } from '@/config/rabbitmq.config';
import { RabbitmqService } from './rabbitmq.service';
import { RabbitmqController } from './rabbitmq.controller';

/**
 * RabbitMQ 模块
 * - 基于 @golevelup/nestjs-rabbitmq
 * - 提供统一的消息发布与订阅能力
 */
@Global()
@Module({
  imports: [RabbitMQModule.forRoot(rabbitmqConfig)],
  controllers: [RabbitmqController],
  providers: [
    RabbitmqService,
    {
      provide: 'IRabbitmqService',
      useClass: RabbitmqService,
    },
  ],
  exports: ['IRabbitmqService'],
})
export class RabbitMQAppModule {}


