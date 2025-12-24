import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LogWsModule } from './modules/log-ws/log-ws.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 使 ConfigModule 全局可用
      envFilePath: '.env', // 明确指定 .env 文件路径
    }),
    LogWsModule,
  ],
  controllers: [],
  providers: [],
})
class AppModule implements OnModuleInit {
  public onModuleInit(): void {
    // 模块初始化逻辑
  }
}

export default AppModule;
