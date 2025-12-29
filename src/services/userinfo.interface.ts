import { UserInfoDto, UserInfoResponseDto, UserLoginResponseDto } from '@/dto/userinfo.dto';

export interface IUserInfoService {
  getUserInfo(): Promise<UserInfoResponseDto>;
  registerUser(): Promise<string>;
  userLogin(userInfoDto: UserInfoDto): Promise<UserLoginResponseDto>;
}

