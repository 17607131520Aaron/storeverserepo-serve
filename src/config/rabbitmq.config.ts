import type { RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';

// RabbitMQ配置
export const rabbitmqConfig: RabbitMQConfig = {
  uri: `amqp://${process.env.RABBITMQ_USERNAME || 'guest'}:${process.env.RABBITMQ_PASSWORD || 'guest'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || '5672'}`,
  exchanges: [
    {
      name: 'user_exchange',
      type: 'topic',
      options: {
        durable: true,
      },
    },
    {
      name: 'notification_exchange',
      type: 'topic',
      options: {
        durable: true,
      },
    },
    {
      name: 'email_exchange',
      type: 'topic',
      options: {
        durable: true,
      },
    },
    {
      name: 'log_exchange',
      type: 'topic',
      options: {
        durable: true,
      },
    },
  ],
  queues: [
    {
      name: 'user_queue',
      options: {
        durable: true,
        autoDelete: false,
      },
      exchange: 'user_exchange',
      routingKey: 'user.*',
    },
    {
      name: 'notification_queue',
      options: {
        durable: true,
        autoDelete: false,
      },
      exchange: 'notification_exchange',
      routingKey: 'notification.*',
    },
    {
      name: 'email_queue',
      options: {
        durable: true,
        autoDelete: false,
      },
      exchange: 'email_exchange',
      routingKey: 'email.*',
    },
    {
      name: 'log_queue',
      options: {
        durable: true,
        autoDelete: false,
      },
      exchange: 'log_exchange',
      routingKey: 'log.*',
    },
  ],
  enableControllerDiscovery: true, // 启用控制器发现
  connectionInitOptions: {
    wait: false, // 不等待连接建立
    reject: false, // 连接失败时不拒绝
  },
  prefetchCount: 1, // 预取数量
  defaultRpcTimeout: 30000, // 默认RPC超时时间
};

// 队列名称常量
export const QUEUE_NAMES = {
  USER_QUEUE: 'user_queue',
  NOTIFICATION_QUEUE: 'notification_queue',
  EMAIL_QUEUE: 'email_queue',
  LOG_QUEUE: 'log_queue',
} as const;

// 交换机名称常量
export const EXCHANGE_NAMES = {
  USER_EXCHANGE: 'user_exchange',
  NOTIFICATION_EXCHANGE: 'notification_exchange',
  EMAIL_EXCHANGE: 'email_exchange',
  LOG_EXCHANGE: 'log_exchange',
} as const;

// 路由键常量
export const ROUTING_KEYS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  NOTIFICATION_SENT: 'notification.sent',
  EMAIL_SENT: 'email.sent',
  LOG_CREATED: 'log.created',
} as const;
