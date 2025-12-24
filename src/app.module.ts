import { Module, OnModuleInit } from '@nestjs/common';
import { LogWsModule } from './modules/log-ws/log-ws.module';

@Module({
  imports: [LogWsModule],
  controllers: [],
  providers: [],
})
class AppModule implements OnModuleInit {
  public onModuleInit(): void {
    // 模块初始化逻辑
  }
}

export default AppModule;
