import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGE_NAMES, ROUTING_KEYS } from '@/config/rabbitmq.config';

@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name);

  public constructor(private readonly amqpConnection: AmqpConnection) {}

  /**
   * 发送用户相关消息
   */
  public async publishUserEvent(event: string, payload: unknown): Promise<void> {
    await this.publish(EXCHANGE_NAMES.USER_EXCHANGE, event, payload);
  }

  /**
   * 通用发布方法
   */
  public async publish(
    exchange: string,
    routingKey: string,
    payload: unknown,
  ): Promise<void> {
    this.logger.log(`Publishing message: exchange=${exchange}, routingKey=${routingKey}`);
    await this.amqpConnection.publish(exchange, routingKey, payload);
  }
}


