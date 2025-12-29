/* eslint-disable no-console */
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

function getPortFromConfig(cfg: string | number | undefined, fallback = 3000): number {
  const v = Number(cfg);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}
function getEnvFromConfig(cfg: string | undefined): string {
  return (cfg ?? 'development').toString().trim();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  const port = getPortFromConfig(config.get<string>('SERVICE_PORT'), 3000);

  if (env !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('API 文档')
      .setDescription('API 描述')
      .setVersion('1.0')
      .addTag('api')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    // Swagger UI - 保留原有 Swagger 文档界面
    SwaggerModule.setup('api', app, document, {
      jsonDocumentUrl: '/api-json', // 提供 OpenAPI JSON 文件
      customSiteTitle: 'API 文档 - Swagger',
    });

    // Scalar UI - 现代化的 API 文档界面
    app.use(
      '/api-docs',
      apiReference({
        spec: {
          content: document,
        },
        theme: 'default',
        layout: 'modern',
        defaultHttpClient: {
          targetKey: 'javascript',
          clientKey: 'axios',
        },
      }),
    );

    console.log(`📚 API 文档已启动：`);
    console.log(`   Swagger UI: http://localhost:${port}/api`);
    console.log(`   Scalar UI:  http://localhost:${port}/api-docs`);
    console.log(`   OpenAPI JSON: http://localhost:${port}/api-json`);
  }
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
