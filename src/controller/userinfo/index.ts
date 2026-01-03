import { Public } from '@/auth/public.decorator';
import { useDto } from '@/decorators/use-dto.decorator';
import { GetWechatUserInfoByCodeDto, UserInfoDto, UserInfoResponseDto, UserLoginResponseDto, UserRegisterDto, WechatLoginDto, WechatUserInfoByCodeResponseDto, WechatUserInfoResponseDto } from '@/dto/userinfo.dto';
import type { IUserInfoService } from '@/services/userinfo.interface';
import { BadRequestException, Body, Controller, Get, Inject, Post, Query, Request, UnauthorizedException } from '@nestjs/common';
import type { JwtPayload } from '@/auth/auth.service';

@Controller('userinfo')
export class UserController {
  constructor(@Inject('IUserInfoService') private readonly userinfoService: IUserInfoService) {}

  @Get('getUserInfo')
  public getUserInfo(@Request() req: Request & { user?: JwtPayload }): Promise<UserInfoResponseDto> {
    // 从 JWT token 中获取当前用户ID
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('无法获取用户信息：用户未认证');
    }
    // 返回原始对象，由全局 DTO 映射拦截器处理
    return this.userinfoService.getUserInfo(userId);
  }

  @Get('getUserInfoByUsername')
  @Public()
  public getUserInfoByUsername(@Query('username') username: string): Promise<UserInfoResponseDto> {
    if (!username) {
      throw new BadRequestException('用户名不能为空');
    }
    return this.userinfoService.getUserInfoByUsername(username);
  }

  //微信用户信息接口
  @Get('getWechatUserInfo')
  @useDto(WechatUserInfoResponseDto)
  public getWechatUserInfo(@Request() req: Request & { user?: JwtPayload }): Promise<WechatUserInfoResponseDto> {
    // 从 JWT token 中获取当前用户ID
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('无法获取微信用户信息：用户未认证');
    }
    // 返回原始对象，由全局 DTO 映射拦截器处理
    return this.userinfoService.getWechatUserInfo(userId);
  }

  //用户登录接口
  @Post('userLogin')
  @Public()
  @useDto(UserLoginResponseDto)
  public userLogin(@Body() userInfoDto: UserInfoDto): Promise<UserLoginResponseDto> {
    return this.userinfoService.userLogin(userInfoDto);
  }

  //通过code获取微信用户信息接口（使用openid查询）
  @Post('getWechatUserInfoByCode')
  @Public()
  @useDto(WechatUserInfoByCodeResponseDto)
  public getWechatUserInfoByCode(@Body() dto: GetWechatUserInfoByCodeDto): Promise<WechatUserInfoByCodeResponseDto> {
    return this.userinfoService.getWechatUserInfoByCode(dto);
  }

  //微信登录接口
  @Post('wechatLogin')
  @Public()
  @useDto(UserLoginResponseDto)
  public wechatLogin(@Body() wechatLoginDto: WechatLoginDto): Promise<UserLoginResponseDto> {
    return this.userinfoService.wechatLogin(wechatLoginDto);
  }

  //用户注册接口
  @Post('registerUser')
  @Public()
  public registerUser(@Body() userRegisterDto: UserRegisterDto): Promise<string> {
    return this.userinfoService.registerUser(userRegisterDto);
  }

  //用户登出接口
  @Post('logout')
  public async logout(@Request() req: Request & { user?: JwtPayload }): Promise<string> {
    // 从请求头中获取 token
    const authHeader = (req.headers as { authorization?: string }).authorization;
    const token = authHeader?.replace('Bearer ', '');
    if (token) {
      await this.userinfoService.logout(token);
    }
    return '登出成功';
  }
}
