import { Logger } from '@nestjs/common';
import { createServer, type Server as HttpServer } from 'http';

// WebSocket 相关类型定义
interface IWebSocket {
  readyState: number;
  send: (data: string) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  close: () => void;
}

interface IWebSocketServer {
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  close: (callback?: () => void) => void;
}

interface IWebSocketServerConstructor {
  new (options: { server: HttpServer; path: string }): IWebSocketServer;
}

interface IWebSocketConstants {
  OPEN: number;
}

// 动态导入 ws 包
let WS_SERVER_CLASS: IWebSocketServerConstructor | null = null;
let WS_CONSTANTS: IWebSocketConstants | null = null;

try {
  const wsModule = require('ws');
  WS_SERVER_CLASS = wsModule.WebSocketServer;
  WS_CONSTANTS = { OPEN: wsModule.WebSocket.OPEN };
} catch {
  // ws 包未安装，将在启动时给出错误提示
  Logger.error(
    'ws 包未安装。请运行: npm install ws @types/ws --save',
    'NativeWsServer',
  );
}

/**
 * 客户端信息接口
 */
interface IClientInfo {
  id: string;
  ip: string;
}

/**
 * 原生 WebSocket 服务器
 * 用于接收 React Native 应用发送的日志，并转发给连接的 web 客户端
 * 支持原生 WebSocket 协议（非 Socket.IO）
 */
export class NativeWsServer {
  private readonly logger = new Logger(NativeWsServer.name);
  private wss: IWebSocketServer | null = null;
  private httpServer: HttpServer | null = null;
  private readonly clients = new Map<IWebSocket, IClientInfo>();
  private clientIdCounter = 0;

  /**
   * 获取当前连接数
   */
  public getConnectionCount(): number {
    return this.clients.size;
  }

  /**
   * 启动原生 WebSocket 服务器
   * @param port 监听端口
   * @param path WebSocket 路径
   */
  public start(port: number, path: string = '/logs'): void {
    if (!WS_SERVER_CLASS || !WS_CONSTANTS) {
      this.logger.error(
        'ws 包未安装，无法启动原生 WebSocket 服务器。请运行: npm install ws @types/ws --save',
      );
      return;
    }

    if (this.wss) {
      this.logger.warn('原生 WebSocket 服务器已在运行');
      return;
    }

    try {
      // 创建 HTTP 服务器用于 WebSocket 升级
      this.httpServer = createServer();

      // 创建 WebSocket 服务器
      this.wss = new WS_SERVER_CLASS({
        server: this.httpServer,
        path,
      });

      // 处理 WebSocket 连接
      this.wss.on('connection', (ws: IWebSocket, request: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }) => {
        this.handleConnection(ws, request);
      });

      // 启动 HTTP 服务器
      // 监听所有网络接口 (0.0.0.0)，以便接受来自模拟器和真机的连接
      this.httpServer.listen(port, '0.0.0.0', () => {
        this.logger.log(`原生 WebSocket 服务器已启动: ws://0.0.0.0:${port}${path}`);
        this.logger.log(`监听所有网络接口，可通过以下地址访问:`);
        this.logger.log(`  - ws://localhost:${port}${path} (本机)`);
        this.logger.log(`  - ws://10.0.2.2:${port}${path} (Android 模拟器)`);
        this.logger.log(`  - ws://<本机IP>:${port}${path} (真机/其他设备)`);
      });

      // 处理服务器错误
      this.httpServer.on('error', (error: Error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = (error as NodeJS.ErrnoException).code;
        this.logger.error(`HTTP 服务器错误: ${errorMessage} (code: ${errorCode})`);
        
        // 如果是端口被占用，给出明确提示
        if (errorCode === 'EADDRINUSE') {
          this.logger.error(`端口 ${port} 已被占用，请检查是否有其他服务在使用该端口`);
        }
      });

      this.wss.on('error', (error: Error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`WebSocket 服务器错误: ${errorMessage}`);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`启动原生 WebSocket 服务器失败: ${errorMessage}`, errorStack);
    }
  }

  /**
   * 停止原生 WebSocket 服务器
   */
  public stop(): void {
    if (this.wss) {
      this.wss.close(() => {
        this.logger.log('原生 WebSocket 服务器已关闭');
      });
      this.wss = null;
    }

    if (this.httpServer) {
      this.httpServer.close(() => {
        this.logger.log('HTTP 服务器已关闭');
      });
      this.httpServer = null;
    }

    this.clients.clear();
  }

  /**
   * 处理客户端连接
   */
  private handleConnection(ws: IWebSocket, request: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): void {
    const clientId = `native-${++this.clientIdCounter}`;
    const forwardedFor = request.headers['x-forwarded-for'];
    const realIp = request.headers['x-real-ip'];
    const remoteAddress = request.socket?.remoteAddress;
    
    const clientIp =
      (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0]?.trim() : undefined) ||
      (typeof realIp === 'string' ? realIp : undefined) ||
      remoteAddress ||
      'unknown';

    this.clients.set(ws, { id: clientId, ip: String(clientIp) });

    this.logger.log(
      `客户端连接: ${clientId}，IP: ${clientIp}，当前连接数: ${this.clients.size}`,
    );

    // 发送欢迎消息
    this.sendWelcomeMessage(ws, String(clientIp));

    // 处理消息
    ws.on('message', (data: Buffer) => {
      this.handleMessage(ws, data);
    });

    // 处理关闭
    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    // 处理错误
    ws.on('error', (error) => {
      this.logger.error(`客户端 ${clientId} 错误:`, error);
    });
  }

  /**
   * 处理客户端消息
   */
  private handleMessage(sender: IWebSocket, data: Buffer): void {
    try {
      const messageStr = data.toString('utf-8');
      const parsedData = JSON.parse(messageStr);

      // 如果是日志消息，广播给所有客户端（除了发送者）
      if (parsedData.type === 'js-log') {
        const clientInfo = this.clients.get(sender);
        this.logger.debug(
          `收到日志: [${parsedData.level}] ${(parsedData.message as string)?.substring(0, 50)}... (来自: ${clientInfo?.id})`,
        );

        // 广播给所有客户端（除了发送者）
        this.broadcastToOthers(sender, messageStr);
      } else {
        // 其他类型的消息，也广播给所有客户端
        this.broadcastToAll(messageStr);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`解析消息失败: ${errorMessage}`);
    }
  }

  /**
   * 处理客户端断开
   */
  private handleDisconnect(ws: IWebSocket): void {
    const clientInfo = this.clients.get(ws);
    if (clientInfo) {
      this.clients.delete(ws);
      this.logger.log(
        `客户端断开: ${clientInfo.id}，IP: ${clientInfo.ip}，当前连接数: ${this.clients.size}`,
      );
    }
  }

  /**
   * 发送欢迎消息
   */
  private sendWelcomeMessage(ws: IWebSocket, clientIp: string): void {
    try {
      const message = JSON.stringify({
        type: 'system',
        message: `已连接到日志服务器 (客户端IP: ${clientIp})`,
        timestamp: new Date().toISOString(),
        clientIp,
      });

      if (WS_CONSTANTS && ws.readyState === WS_CONSTANTS.OPEN) {
        ws.send(message);
      }
    } catch (error) {
      this.logger.error('发送欢迎消息失败:', error);
    }
  }

  /**
   * 广播消息给所有客户端（除了发送者）
   */
  private broadcastToOthers(sender: IWebSocket, message: string): void {
    try {
      const parsedData = JSON.parse(message);
      const messageStr = JSON.stringify(parsedData);

      this.clients.forEach((_clientInfo, ws) => {
        if (ws !== sender && WS_CONSTANTS && ws.readyState === WS_CONSTANTS.OPEN) {
          try {
            ws.send(messageStr);
          } catch (error) {
            this.logger.error('广播消息失败:', error);
          }
        }
      });
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
      const messageStr = JSON.stringify(parsedData);

      this.clients.forEach((_clientInfo, ws) => {
        if (WS_CONSTANTS && ws.readyState === WS_CONSTANTS.OPEN) {
          try {
            ws.send(messageStr);
          } catch (error) {
            this.logger.error('广播消息失败:', error);
          }
        }
      });
    } catch (error) {
      this.logger.error('广播消息失败:', error);
    }
  }
}

