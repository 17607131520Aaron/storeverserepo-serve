import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RabbitmqService } from './rabbitmq.service';
import { ROUTING_KEYS } from '@/config/rabbitmq.config';

@ApiTags('rabbitmq')
@Controller('rabbitmq')
export class RabbitmqController {
  public constructor(private readonly rabbitmqService: RabbitmqService) {}

  @Post('user-created')
  @ApiOperation({ summary: '发送用户创建事件到 RabbitMQ' })
  public async sendUserCreated(@Body() body: unknown): Promise<boolean> {
    await this.rabbitmqService.publishUserEvent(ROUTING_KEYS.USER_CREATED, body);
    return true;
  }
}


