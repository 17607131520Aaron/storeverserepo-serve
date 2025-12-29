import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {AppModule} from './app.module';
import { ConfigService } from '@nestjs/config';

function getPortFromConfig(cfg: string | number | undefined, fallback = 3000): number {
  const v = Number(cfg);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}
function getEnvFromConfig(cfg: string | undefined): string {
  return (cfg ?? 'development').toString().trim();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Socket.IO 是 NestJS 的默认 WebSocket 适配器，无需额外配置

  // 全局请求体验证：把字段校验从 services 挪到 DTO + 管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 只保留在 DTO 上声明的字段
      forbidNonWhitelisted: true, // 请求里多出来的字段直接报错
      transform: true, // 自动把原始数据转换成 DTO 类型
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const config = app.get(ConfigService);
  const env = getEnvFromConfig(config.get<string>('NODE_ENV'));

  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('API 文档')
      .setDescription('API 描述')
      .setVersion('1.0')
      .addTag('api')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);
  }

  const port = getPortFromConfig(config.get<string>('SERVICE_PORT'), 3000);
  // const port = 3000;

  // 添加调试信息
  console.log('Environment variables:');
  console.log('NODE_ENV:', config.get<string>('NODE_ENV'));
  console.log('SERVICE_PORT:', config.get<string>('SERVICE_PORT'));
  console.log('Resolved port:', port);

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}  (env=${env})`);
}
void bootstrap();