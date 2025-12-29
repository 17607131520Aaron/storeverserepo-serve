import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DtoTransformInterceptor } from './interceptors/dto-transform.interceptor';
import { GlobalResponseWrapperInterceptor } from '@/interceptors/global-response.interceptor';
import { HttpExceptionFilter } from '@/interceptors/http-exception.interceptor';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { UserModule } from '@/modules/user.modules';
import { RedisModule } from '@/redis';
import { RabbitMQAppModule } from '@/rabbitmq';
import { databaseConfig } from '@/config/database.config';
import { AuthModule } from '@/auth/auth.module';
import { LogWsModule } from './modules/log-ws/log-ws.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      load: [
        () => {
          const env = process.env.NODE_ENV || 'development';
          console.log(`[ConfigModule] Loading environment: ${env}`);
          console.log(`[ConfigModule] Looking for files: .env.${env}, .env`);
          return {};
        },
      ],
    }),
    TypeOrmModule.forRoot(databaseConfig), // 全局配置数据库连接
    RedisModule, // Redis模块
    UserModule,
    RabbitMQAppModule, // RabbitMQ模块
    AuthModule,
    LogWsModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: GlobalResponseWrapperInterceptor },
    { provide: APP_INTERCEPTOR, useClass: DtoTransformInterceptor },
    { provide: 'DEFAULT_DTO', useValue: null },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: 'DEFAULT_SUCCESS_CODE', useValue: 0 },
    { provide: 'DEFAULT_ERROR_CODE', useValue: 9000 },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule implements OnModuleInit {
  public onModuleInit(): void {
    console.log('\n✅ MySQL数据库连接成功！');
    console.log(`📊 数据库: ${process.env.MYSQL_DATABASE}`);
    console.log(`🌐 连接地址: ${process.env.NODE_MYSQL_HOST}:${process.env.MYSQL_PORT}`);
    console.log(`👤 用户名: ${process.env.MYSQL_USERNAME}`);
    console.log(`🔐 端口: ${process.env.MYSQL_PORT}`);
    console.log('========================\n');

    console.log('✅ Redis模块已加载！');
    console.log(
      `🌐 Redis地址: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
    );
    console.log(`🗄️ Redis数据库: ${process.env.REDIS_DB || '0'}`);
    console.log('========================\n');

    console.log('✅ RabbitMQ模块已加载！');
    console.log(
      `🌐 RabbitMQ地址: ${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || '5672'}`,
    );
    console.log(`👤 用户名: ${process.env.RABBITMQ_USERNAME || 'guest'}`);
    console.log('========================\n');
  }
}
