import { AuthService } from '@/auth/auth.service';
import {
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
import { User } from '@/entity/user.entity';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { createDecipheriv } from 'crypto';
import { Repository } from 'typeorm';
import { IUserInfoService } from './userinfo.interface';

interface WechatCode2SessionResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class UserInfoServiceImpl implements IUserInfoService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  public async getUserInfo(userId: number): Promise<UserInfoResponseDto> {
    try {
      // 从数据库获取当前用户信息
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('用户不存在');
      }

      // 只返回用户基本信息，不返回密码
      return {
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        wechatNickName: user.wechatNickName,
        wechatAvatarUrl: user.wechatAvatarUrl,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`获取用户信息失败: ${(error as Error).message}`);
    }
  }

  public async getUserInfoByUsername(username: string): Promise<UserInfoResponseDto> {
    try {
      // 从数据库通过用户名获取用户信息
      const user = await this.userRepository.findOne({
        where: { username, status: 1 },
      });

      if (!user) {
        throw new BadRequestException('用户不存在');
      }

      // 只返回用户基本信息，不返回密码
      return {
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        wechatNickName: user.wechatNickName,
        wechatAvatarUrl: user.wechatAvatarUrl,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`获取用户信息失败: ${(error as Error).message}`);
    }
  }

  public async getWechatUserInfo(userId: number): Promise<WechatUserInfoResponseDto> {
    try {
      // 从数据库获取当前用户的微信信息
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('用户不存在');
      }

      // 只返回微信用户信息
      return {
        wechatNickName: user.wechatNickName,
        wechatAvatarUrl: user.wechatAvatarUrl,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`获取微信用户信息失败: ${(error as Error).message}`);
    }
  }

  /**
   * 通过微信code获取用户信息（使用openid查询）
   * 根据微信文档，需要通过code获取openid，然后查询数据库中已保存的用户信息
   */
  public async getWechatUserInfoByCode(
    dto: GetWechatUserInfoByCodeDto,
  ): Promise<WechatUserInfoByCodeResponseDto> {
    try {
      const appId = this.configService.get<string>('WECHAT_APPID');
      const secret = this.configService.get<string>('WECHAT_SECRET');

      if (!appId || !secret) {
        throw new BadRequestException('微信配置未设置，请联系管理员');
      }

      // 调用微信API获取openid和session_key
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${dto.code}&grant_type=authorization_code`;
      const response = await fetch(url);
      const data = (await response.json()) as WechatCode2SessionResponse;

      if (data.errcode || !data.openid) {
        const errorMsg = data.errmsg ?? '获取微信用户信息失败';
        throw new UnauthorizedException(`获取微信用户信息失败: ${errorMsg}`);
      }

      // 根据openid查询数据库中已保存的用户信息
      const user = await this.userRepository.findOne({
        where: { wechatOpenId: data.openid, status: 1 },
      });

      // 返回用户信息（如果用户存在则返回已保存的信息，否则返回null）
      return {
        openid: data.openid,
        wechatNickName: user?.wechatNickName || null,
        wechatAvatarUrl: user?.wechatAvatarUrl || null,
        exists: !!user,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `获取微信用户信息失败: ${(error as Error).message}`,
      );
    }
  }

  /**
   * 解密微信手机号
   * 使用微信提供的加密数据、初始向量和session_key进行解密
   */
  public async decryptPhoneNumber(
    dto: DecryptPhoneNumberDto,
  ): Promise<DecryptPhoneNumberResponseDto> {
    try {
      const appId = this.configService.get<string>('WECHAT_APPID');
      const secret = this.configService.get<string>('WECHAT_SECRET');

      if (!appId || !secret) {
        throw new BadRequestException('微信配置未设置，请联系管理员');
      }

      // 调用微信API获取session_key
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${dto.code}&grant_type=authorization_code`;
      const response = await fetch(url);
      const data = (await response.json()) as WechatCode2SessionResponse;

      if (data.errcode || !data.session_key) {
        const errorMsg = data.errmsg ?? '获取session_key失败';
        throw new UnauthorizedException(`获取session_key失败: ${errorMsg}`);
      }

      // 使用AES-128-CBC解密
      const sessionKey = Buffer.from(data.session_key, 'base64');
      const encryptedData = Buffer.from(dto.encryptedData, 'base64');
      const iv = Buffer.from(dto.iv, 'base64');

      // 创建解密器
      const decipher = createDecipheriv('aes-128-cbc', sessionKey, iv);
      decipher.setAutoPadding(true);

      // 解密
      let decrypted = decipher.update(encryptedData, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      // 解析JSON
      const decryptedData = JSON.parse(decrypted);

      // 验证appid
      if (decryptedData.watermark?.appid !== appId) {
        throw new UnauthorizedException('解密数据appid不匹配');
      }

      // 返回手机号
      return {
        phoneNumber: decryptedData.phoneNumber,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `解密手机号失败: ${(error as Error).message}`,
      );
    }
  }

  public async registerUser(userRegisterDto: UserRegisterDto): Promise<string> {
    try {
      // 验证账号格式（3-20个字符，只能包含字母、数字、下划线）
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(userRegisterDto.username)) {
        throw new BadRequestException('账号格式不正确：3-20个字符，只能包含字母、数字、下划线');
      }

      // 验证密码强度（至少6个字符）
      if (userRegisterDto.password.length < 6) {
        throw new BadRequestException('密码长度至少6个字符');
      }

      // 检查账号是否已存在
      const existingUser = await this.userRepository.findOne({
        where: { username: userRegisterDto.username },
      });

      if (existingUser) {
        throw new ConflictException('账号已存在');
      }

      // 如果提供了邮箱，检查邮箱是否已被使用
      if (userRegisterDto.email) {
        const existingEmail = await this.userRepository.findOne({
          where: { email: userRegisterDto.email },
        });
        if (existingEmail) {
          throw new ConflictException('邮箱已被使用');
        }
      }

      // 如果提供了手机号，检查手机号是否已被使用
      if (userRegisterDto.phone) {
        const existingPhone = await this.userRepository.findOne({
          where: { phone: userRegisterDto.phone },
        });
        if (existingPhone) {
          throw new ConflictException('手机号已被使用');
        }
      }

      // 创建新用户（使用哈希密码）
      const hashed = await bcrypt.hash(userRegisterDto.password, 10);
      const newUser = new User();
      newUser.username = userRegisterDto.username;
      newUser.realName = userRegisterDto.realName;
      newUser.password = hashed;
      if (userRegisterDto.email) {
        newUser.email = userRegisterDto.email;
      }
      if (userRegisterDto.phone) {
        newUser.phone = userRegisterDto.phone;
      }
      newUser.status = 1;

      await this.userRepository.save(newUser);
      return '注册成功';
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // 处理数据库唯一性约束错误
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Duplicate entry') || errorMessage.includes('UNIQUE constraint')) {
        if (errorMessage.includes('username')) {
          throw new ConflictException('账号已存在');
        }
        if (errorMessage.includes('email')) {
          throw new ConflictException('邮箱已被使用');
        }
        if (errorMessage.includes('phone')) {
          throw new ConflictException('手机号已被使用');
        }
        throw new ConflictException('数据已存在，请检查账号、邮箱或手机号');
      }
      throw new BadRequestException(`注册失败: ${errorMessage}`);
    }
  }

  public async logout(token: string): Promise<void> {
    await this.authService.revokeToken(token);
  }

  public async userLogin(userInfoDto: UserInfoDto): Promise<UserLoginResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { username: userInfoDto.username, status: 1 },
      });
      if (!user) {
        throw new UnauthorizedException('用户名或密码错误');
      }
      const ok = await bcrypt.compare(userInfoDto.password, user.password);
      if (!ok) {
        throw new UnauthorizedException('用户名或密码错误');
      }

      const { token, expiresIn } = await this.authService.signUser({
        sub: user.id,
        username: user.username,
      });
      return { token, expiresIn };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`登录失败: ${(error as Error).message}`);
    }
  }

  public async wechatLogin(wechatLoginDto: WechatLoginDto): Promise<UserLoginResponseDto> {
    try {
      // 记录接收到的参数
      console.log('[微信登录] 接收到的参数:', {
        code: wechatLoginDto.code ? '已提供' : '未提供',
        nickName: wechatLoginDto.nickName || '未提供',
        avatarUrl: wechatLoginDto.avatarUrl || '未提供',
      });

      const appId = this.configService.get<string>('WECHAT_APPID');
      const secret = this.configService.get<string>('WECHAT_SECRET');

      if (!appId || !secret) {
        throw new BadRequestException('微信配置未设置，请联系管理员');
      }

      // 调用微信API获取openid和session_key
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${wechatLoginDto.code}&grant_type=authorization_code`;
      const response = await fetch(url);
      const data = (await response.json()) as WechatCode2SessionResponse;

      if (data.errcode || !data.openid) {
        const errorMsg = data.errmsg ?? '微信登录失败';
        throw new UnauthorizedException(`微信登录失败: ${errorMsg}`);
      }

      // 根据openid查找用户
      let user = await this.userRepository.findOne({
        where: { wechatOpenId: data.openid, status: 1 },
      });

      // 如果用户不存在，创建新用户
      if (!user) {
        // 生成一个唯一的username（使用wechat_前缀 + openid的一部分）
        const usernamePrefix = 'wechat_';
        const username = usernamePrefix + data.openid.substring(0, 16);

        // 检查username是否已存在，如果存在则添加随机后缀
        let finalUsername = username;
        let counter = 1;
        while (await this.userRepository.findOne({ where: { username: finalUsername } })) {
          finalUsername = `${username}_${counter}`;
          counter++;
        }

        // 创建新用户（微信登录用户不需要密码）
        user = new User();
        user.username = finalUsername;
        user.wechatOpenId = data.openid;
        user.status = 1;
        // 微信登录用户需要设置一个随机密码（虽然不会用到，但数据库字段非空）
        user.password = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
        // 保存微信用户信息（如果提供）
        if (wechatLoginDto.nickName) {
          user.wechatNickName = wechatLoginDto.nickName;
          console.log('[微信登录] 新用户 - 保存昵称:', wechatLoginDto.nickName);
        }
        if (wechatLoginDto.avatarUrl) {
          user.wechatAvatarUrl = wechatLoginDto.avatarUrl;
          console.log('[微信登录] 新用户 - 保存头像:', wechatLoginDto.avatarUrl);
        }
        await this.userRepository.save(user);
        console.log('[微信登录] 新用户创建成功，用户信息:', {
          id: user.id,
          wechatNickName: user.wechatNickName,
          wechatAvatarUrl: user.wechatAvatarUrl,
        });
      } else {
        // 如果用户已存在，更新微信用户信息（如果提供）
        // 注意：即使旧值为 null，只要提供了新值就更新
        let needUpdate = false;
        if (wechatLoginDto.nickName !== undefined && user.wechatNickName !== wechatLoginDto.nickName) {
          console.log('[微信登录] 更新用户昵称:', {
            旧值: user.wechatNickName,
            新值: wechatLoginDto.nickName,
          });
          user.wechatNickName = wechatLoginDto.nickName;
          needUpdate = true;
        }
        if (wechatLoginDto.avatarUrl !== undefined && user.wechatAvatarUrl !== wechatLoginDto.avatarUrl) {
          console.log('[微信登录] 更新用户头像:', {
            旧值: user.wechatAvatarUrl,
            新值: wechatLoginDto.avatarUrl,
          });
          user.wechatAvatarUrl = wechatLoginDto.avatarUrl;
          needUpdate = true;
        }
        if (needUpdate) {
          await this.userRepository.save(user);
          console.log('[微信登录] 用户信息已更新，最终值:', {
            wechatNickName: user.wechatNickName,
            wechatAvatarUrl: user.wechatAvatarUrl,
          });
        } else {
          console.log('[微信登录] 用户已存在，无需更新:', {
            wechatNickName: user.wechatNickName,
            wechatAvatarUrl: user.wechatAvatarUrl,
            接收到的nickName: wechatLoginDto.nickName || '未提供',
            接收到的avatarUrl: wechatLoginDto.avatarUrl || '未提供',
          });
        }
      }

      // 生成JWT token
      const { token, expiresIn } = await this.authService.signUser({
        sub: user.id,
        username: user.username,
      });

      return { token, expiresIn };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`微信登录失败: ${(error as Error).message}`);
    }
  }

  public async wechatRegister(wechatRegisterDto: WechatRegisterDto): Promise<UserLoginResponseDto> {
    try {
      // 记录接收到的参数
      console.log('[微信注册] 接收到的参数:', {
        code: wechatRegisterDto.code ? '已提供' : '未提供',
        nickName: wechatRegisterDto.nickName || '未提供',
        avatarUrl: wechatRegisterDto.avatarUrl || '未提供',
        phone: wechatRegisterDto.phone || '未提供',
        country: wechatRegisterDto.country || '未提供',
        region: wechatRegisterDto.region || '未提供',
        wechatNumber: wechatRegisterDto.wechatNumber || '未提供',
      });

      const appId = this.configService.get<string>('WECHAT_APPID');
      const secret = this.configService.get<string>('WECHAT_SECRET');

      if (!appId || !secret) {
        throw new BadRequestException('微信配置未设置，请联系管理员');
      }

      // 调用微信API获取openid和session_key
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${wechatRegisterDto.code}&grant_type=authorization_code`;
      const response = await fetch(url);
      const data = (await response.json()) as WechatCode2SessionResponse;

      if (data.errcode || !data.openid) {
        const errorMsg = data.errmsg ?? '微信注册失败';
        throw new UnauthorizedException(`微信注册失败: ${errorMsg}`);
      }

      // 检查用户是否已存在
      const existingUser = await this.userRepository.findOne({
        where: { wechatOpenId: data.openid },
      });

      if (existingUser) {
        throw new ConflictException('该微信账号已注册，请直接登录');
      }

      // 检查手机号是否已被使用
      if (wechatRegisterDto.phone) {
        const existingPhone = await this.userRepository.findOne({
          where: { phone: wechatRegisterDto.phone },
        });
        if (existingPhone) {
          throw new ConflictException('手机号已被使用');
        }
      }

      // 生成一个唯一的username（使用wechat_前缀 + openid的一部分）
      const usernamePrefix = 'wechat_';
      const username = usernamePrefix + data.openid.substring(0, 16);

      // 检查username是否已存在，如果存在则添加随机后缀
      let finalUsername = username;
      let counter = 1;
      while (await this.userRepository.findOne({ where: { username: finalUsername } })) {
        finalUsername = `${username}_${counter}`;
        counter++;
      }

      // 创建新用户
      const newUser = new User();
      newUser.username = finalUsername;
      newUser.wechatOpenId = data.openid;
      newUser.status = 1;
      // 微信注册用户需要设置一个随机密码（虽然不会用到，但数据库字段非空）
      newUser.password = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
      
      // 保存微信用户信息
      if (wechatRegisterDto.nickName) {
        newUser.wechatNickName = wechatRegisterDto.nickName;
      }
      if (wechatRegisterDto.avatarUrl) {
        newUser.wechatAvatarUrl = wechatRegisterDto.avatarUrl;
      }
      if (wechatRegisterDto.phone) {
        newUser.phone = wechatRegisterDto.phone;
      }
      // 注意：country和region字段在User实体中不存在，如果需要可以添加到实体中
      // 这里先保存到realName字段作为临时方案，或者可以扩展User实体
      if (wechatRegisterDto.country || wechatRegisterDto.region) {
        const locationInfo = [wechatRegisterDto.country, wechatRegisterDto.region].filter(Boolean).join(' ');
        if (locationInfo) {
          // 可以保存到realName或者扩展User实体添加新字段
          // 这里暂时不保存，如果需要可以扩展User实体
        }
      }

      await this.userRepository.save(newUser);
      console.log('[微信注册] 新用户注册成功，用户信息:', {
        id: newUser.id,
        username: newUser.username,
        wechatNickName: newUser.wechatNickName,
        wechatAvatarUrl: newUser.wechatAvatarUrl,
        phone: newUser.phone,
      });

      // 生成JWT token
      const { token, expiresIn } = await this.authService.signUser({
        sub: newUser.id,
        username: newUser.username,
      });

      return { token, expiresIn };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`微信注册失败: ${(error as Error).message}`);
    }
  }
}
