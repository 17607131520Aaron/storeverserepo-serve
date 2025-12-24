import { Module, OnModuleInit } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
class AppModule implements OnModuleInit {
  public onModuleInit():void {
    throw new Error('Method not implemented.');
  }
}

export default AppModule;
