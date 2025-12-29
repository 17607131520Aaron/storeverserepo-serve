import { Controller, Get, Post, Inject, Body } from '@nestjs/common';
import type { IUserInfoService } from '@/services/userinfo.interface';
import { UserInfoResponseDto, UserInfoDto, UserLoginResponseDto } from '@/dto/userinfo.dto';
import { Public } from '@/auth/public.decorator';
import { useDto } from '@/decorators/use-dto.decorator';

@Controller('userinfo')
export class UserController {
  constructor(@Inject('IUserInfoService') private readonly userinfoService: IUserInfoService) {}

  @Get('getUserInfo')
  public async getUserInfo(): Promise<UserInfoResponseDto> {
    // 返回原始对象，由全局 DTO 映射拦截器处理
    return await this.userinfoService.getUserInfo();
  }

  //用户登录接口
  @Post('userLogin')
  @Public()
  @useDto(UserLoginResponseDto)
  public async userLogin(@Body() userInfoDto: UserInfoDto): Promise<UserLoginResponseDto> {
    return await this.userinfoService.userLogin(userInfoDto);
  }

  @Post('registerUser')
  @Public()
  public async registerUser(): Promise<string> {
    return await this.userinfoService.registerUser();
  }
}
