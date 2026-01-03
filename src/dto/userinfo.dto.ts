import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

//登录请求参数
export class UserInfoDto {
  @IsNotEmpty()
  @IsString()
  public username: string; //账号

  @IsNotEmpty()
  @IsString()
  public password: string; //密码
}

//微信登录请求参数
export class WechatLoginDto {
  @IsNotEmpty()
  @IsString()
  public code: string; //微信授权码

  @IsOptional()
  @IsString()
  public nickName?: string; //微信昵称（可选）

  @IsOptional()
  @IsString()
  public avatarUrl?: string; //微信头像URL（可选）
}

//注册请求参数
export class UserRegisterDto {
  @IsNotEmpty()
  @IsString()
  public username: string; //账号

  @IsNotEmpty()
  @IsString()
  public realName: string; //用户名（真实姓名）

  @IsNotEmpty()
  @IsString()
  public password: string; //密码

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  public email?: string; //邮箱（可选）

  @IsOptional()
  @IsString()
  public phone?: string; //手机号（可选）
}

export class UserInfoResponseDto {
  @Expose()
  public id: number;

  @Expose()
  public username: string;

  @Expose()
  public realName: string | null;

  @Expose()
  public email: string | null;

  @Expose()
  public phone: string | null;

  @Expose()
  public wechatNickName: string | null;

  @Expose()
  public wechatAvatarUrl: string | null;
}

export class UserLoginResponseDto {
  @Expose()
  public token: string;

  @Expose()
  public expiresIn: number;
}

//微信用户信息响应参数
export class WechatUserInfoResponseDto {
  @Expose()
  public wechatNickName: string | null;

  @Expose()
  public wechatAvatarUrl: string | null;
}

//通过code获取微信用户信息请求参数
export class GetWechatUserInfoByCodeDto {
  @IsNotEmpty()
  @IsString()
  public code: string; //微信授权码
}

//通过code获取微信用户信息响应参数
export class WechatUserInfoByCodeResponseDto {
  @Expose()
  public openid: string;

  @Expose()
  public wechatNickName: string | null;

  @Expose()
  public wechatAvatarUrl: string | null;

  @Expose()
  public exists: boolean; //用户是否已存在
}
