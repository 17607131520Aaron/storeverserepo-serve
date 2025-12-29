import { Controller, Get, Post, Inject, Body } from '@nestjs/common';
import type { UserInfoServiceImpl } from '@/services/userinfoServiceImpl';
import { UserInfoResponseDto, UserInfoDto } from '@/dto/userinfo.dto';

@Controller('userinfo')
export class UserController {
  constructor(@Inject('IUserInfoService') private readonly userinfoService: UserInfoServiceImpl) {}

  @Get('getUserInfo')
  public async getUserInfo(): Promise<UserInfoResponseDto> {
    // 返回原始对象，由全局 DTO 映射拦截器处理
    return await this.userinfoService.getUserInfo();
  }

  //用户登录接口
  @Post('userLogin')
  public async userLogin(@Body() userInfoDto: UserInfoDto): Promise<string> {
    return await this.userinfoService.userLogin(userInfoDto);
  }

  @Post('registerUser')
  public async registerUser(): Promise<string> {
    return await this.userinfoService.registerUser();
  }
}
