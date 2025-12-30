import type { UserInfoDto, UserInfoResponseDto, UserLoginResponseDto, UserRegisterDto } from '@/dto/userinfo.dto';

export interface IUserInfoService {
  getUserInfo(userId: number): Promise<UserInfoResponseDto>;
  getUserInfoByUsername(username: string): Promise<UserInfoResponseDto>;
  registerUser(userRegisterDto: UserRegisterDto): Promise<string>;
  userLogin(userInfoDto: UserInfoDto): Promise<UserLoginResponseDto>;
  logout(token: string): Promise<void>;
}

