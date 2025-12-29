import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

//登录请求参数
export class UserInfoDto {
  @IsNotEmpty()
  @IsString()
  public username: string; //用户名

  @IsNotEmpty()
  @IsString()
  public password: string; //密码
}

//注册请求参数
export class UserRegisterDto {
  @IsNotEmpty()
  @IsString()
  public username: string; //用户名

  @IsNotEmpty()
  @IsString()
  public password: string; //密码

  @IsOptional()
  @IsEmail()
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
  public email: string | null;

  @Expose()
  public phone: string | null;
}

export class UserLoginResponseDto {
  @Expose()
  public token: string;

  @Expose()
  public expiresIn: number;
}
