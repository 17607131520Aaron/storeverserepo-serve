import type {
  GetWechatUserInfoByCodeDto,
  UserInfoDto,
  UserInfoResponseDto,
  UserLoginResponseDto,
  UserRegisterDto,
  WechatLoginDto,
  WechatUserInfoByCodeResponseDto,
  WechatUserInfoResponseDto,
} from '@/dto/userinfo.dto';

export interface IUserInfoService {
  getUserInfo(userId: number): Promise<UserInfoResponseDto>;
  getUserInfoByUsername(username: string): Promise<UserInfoResponseDto>;
  getWechatUserInfo(userId: number): Promise<WechatUserInfoResponseDto>;
  getWechatUserInfoByCode(dto: GetWechatUserInfoByCodeDto): Promise<WechatUserInfoByCodeResponseDto>;
  registerUser(userRegisterDto: UserRegisterDto): Promise<string>;
  userLogin(userInfoDto: UserInfoDto): Promise<UserLoginResponseDto>;
  wechatLogin(wechatLoginDto: WechatLoginDto): Promise<UserLoginResponseDto>;
  logout(token: string): Promise<void>;
}
