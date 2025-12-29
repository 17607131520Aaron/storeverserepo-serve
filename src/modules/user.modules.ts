import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from '@/controller/userinfo';
import { UserInfoServiceImpl } from '@/services/userinfoServiceImpl';
import { User } from '@/entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // 注册User实体，这是使用@InjectRepository的必要条件
  ],
  controllers: [UserController],
  providers: [
    {
      provide: 'IUserInfoService',
      useClass: UserInfoServiceImpl,
    },
  ],
  exports: ['IUserInfoService'],
})
export class UserModule {}
