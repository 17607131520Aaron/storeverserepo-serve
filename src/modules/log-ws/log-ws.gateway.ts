import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * 日志 WebSocket 网关
 * 用于接收 React Native 应用发送的日志，并转发给连接的 web 客户端
 * 使用 Socket.IO 实现，提供更好的连接管理和自动重连功能
 *
 * 注意：客户端需要使用 Socket.IO 客户端库连接
 * - 前端：使用 socket.io-client
 * - React Native：需要使用 socket.io-client（需要安装 socket.io-client 包）
 *
 * 连接示例：
 * ```typescript
 * import { io } from 'socket.io-client';
 * const socket = io('http://localhost:3000', { path: '/logs' });
 * socket.emit('log', { type: 'js-log', level: 'info', message: 'test' });
 * ```
 */
@WebSocketGateway({
  path: '/logs',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class LogWsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;

  private readonly logger = new Logger(LogWsGateway.name);
  private readonly clients = new Map<string, Socket>();
  // 存储客户端对应的真实 IP 地址
  private readonly clientIps = new Map<string, string>();

  public afterInit(_server: Server): void {
    this.logger.log('Socket.IO 日志服务器已初始化');
    this.logger.log(`监听路径: ws://localhost:*/logs`);
  }

  public handleConnection(client: Socket): void {
    const clientId = client.id;
    this.clients.set(clientId, client);

    // 从 auth 或 query 参数中获取前端传递的真实 IP 地址
    const clientIp =
      (client.handshake.auth?.clientIp as string) ||
      (client.handshake.query?.clientIp as string) ||
      client.handshake.address ||
      'unknown';

    // 存储客户端 IP
    this.clientIps.set(clientId, clientIp);

    this.logger.log(
      `客户端连接: ${clientId}，IP: ${clientIp}，当前连接数: ${this.clients.size}`,
    );

    // 发送欢迎消息（包含客户端 IP 信息）
    this.sendWelcomeMessage(client, clientIp);
  }

  public handleDisconnect(client: Socket): void {
    const clientId = client.id;
    const clientIp = this.clientIps.get(clientId) || 'unknown';
    this.clients.delete(clientId);
    this.clientIps.delete(clientId);
    this.logger.log(
      `客户端断开: ${clientId}，IP: ${clientIp}，当前连接数: ${this.clients.size}`,
    );
  }

  /**
   * 处理日志消息
   * 支持两种方式：
   * 1. Socket.IO 事件：client.emit('log', data)
   * 2. 原生消息：直接发送 JSON 字符串
   */
  @SubscribeMessage('log')
  public handleLogMessage(
    @MessageBody() data: string | Record<string, unknown>,
    @ConnectedSocket() client: Socket,
  ): void {
    try {
      const messageStr =
        typeof data === 'string' ? data : JSON.stringify(data);
      const parsedData =
        typeof data === 'string' ? JSON.parse(data) : (data as Record<string, unknown>);

      // 如果是日志消息，广播给所有客户端（除了发送者）
      if (parsedData.type === 'js-log') {
        this.logger.debug(
          `收到日志: [${parsedData.level}] ${(parsedData.message as string)?.substring(0, 50)}...`,
        );

        // 广播给所有客户端（除了发送者）
        this.broadcastToOthers(client, messageStr);
      } else {
        // 其他类型的消息，也广播给所有客户端
        this.broadcastToAll(messageStr);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`解析消息失败: ${errorMessage}`, errorStack);
    }
  }

  /**
   * 处理原始消息（兼容原生 WebSocket 客户端）
   */
  @SubscribeMessage('message')
  public handleRawMessage(
    @MessageBody() data: string | Record<string, unknown>,
    @ConnectedSocket() client: Socket,
  ): void {
    // 将原始消息转发到 log 处理器
    this.handleLogMessage(data, client);
  }

  /**
   * 获取客户端 IP 地址
   */
  public getClientIp(clientId: string): string | undefined {
    return this.clientIps.get(clientId);
  }

  /**
   * 发送欢迎消息
   */
  private sendWelcomeMessage(client: Socket, clientIp?: string): void {
    try {
      client.emit('message', {
        type: 'system',
        message: `已连接到日志服务器${clientIp ? ` (客户端IP: ${clientIp})` : ''}`,
        timestamp: new Date().toISOString(),
        clientIp,
      });
    } catch (error) {
      this.logger.error('发送欢迎消息失败:', error);
    }
  }

  /**
   * 广播消息给所有客户端（除了发送者）
   */
  private broadcastToOthers(sender: Socket, message: string): void {
    try {
      const parsedData = JSON.parse(message);
      // 使用 Socket.IO 的广播功能，自动排除发送者
      sender.broadcast.emit('message', parsedData);
    } catch (error) {
      this.logger.error('广播消息失败:', error);
    }
  }

  /**
   * 广播消息给所有客户端
   */
  private broadcastToAll(message: string): void {
    try {
      const parsedData = JSON.parse(message);
      // 使用 Socket.IO 的广播功能
      this.server.emit('message', parsedData);
    } catch (error) {
      this.logger.error('广播消息失败:', error);
    }
  }
}

