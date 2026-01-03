import type {
  DecryptPhoneNumberDto,
  DecryptPhoneNumberResponseDto,
  GetWechatUserInfoByCodeDto,
  UserInfoDto,
  UserInfoResponseDto,
  UserLoginResponseDto,
  UserRegisterDto,
  WechatLoginDto,
  WechatRegisterDto,
  WechatUserInfoByCodeResponseDto,
  WechatUserInfoResponseDto,
} from '@/dto/userinfo.dto';

export interface IUserInfoService {
  getUserInfo(userId: number): Promise<UserInfoResponseDto>;
  getUserInfoByUsername(username: string): Promise<UserInfoResponseDto>;
  getWechatUserInfo(userId: number): Promise<WechatUserInfoResponseDto>;
  getWechatUserInfoByCode(dto: GetWechatUserInfoByCodeDto): Promise<WechatUserInfoByCodeResponseDto>;
  decryptPhoneNumber(dto: DecryptPhoneNumberDto): Promise<DecryptPhoneNumberResponseDto>;
  registerUser(userRegisterDto: UserRegisterDto): Promise<string>;
  wechatRegister(wechatRegisterDto: WechatRegisterDto): Promise<UserLoginResponseDto>;
  userLogin(userInfoDto: UserInfoDto): Promise<UserLoginResponseDto>;
  wechatLogin(wechatLoginDto: WechatLoginDto): Promise<UserLoginResponseDto>;
  logout(token: string): Promise<void>;
}
