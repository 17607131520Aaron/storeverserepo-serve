import { Public } from '@/auth/public.decorator';
import { useDto } from '@/decorators/use-dto.decorator';
import { UserInfoDto, UserInfoResponseDto, UserLoginResponseDto } from '@/dto/userinfo.dto';
import type { IUserInfoService } from '@/services/userinfo.interface';
import { Body, Controller, Get, Inject, Post } from '@nestjs/common';

@Controller('userinfo')
export class UserController {
  constructor(@Inject('IUserInfoService') private readonly userinfoService: IUserInfoService) {}

  @Get('getUserInfo')
  public getUserInfo(): Promise<UserInfoResponseDto> {
    // 返回原始对象，由全局 DTO 映射拦截器处理
    return this.userinfoService.getUserInfo();
  }

  //用户登录接口
  @Post('userLogin')
  @Public()
  @useDto(UserLoginResponseDto)
  public userLogin(@Body() userInfoDto: UserInfoDto): Promise<UserLoginResponseDto> {
    return this.userinfoService.userLogin(userInfoDto);
  }

  @Post('registerUser')
  @Public()
  public registerUser(): Promise<string> {
    return this.userinfoService.registerUser();
  }
}
