import { Injectable, BadRequestException, UnauthorizedException, HttpException, ConflictException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInfoResponseDto, UserInfoDto, UserLoginResponseDto, UserRegisterDto } from '@/dto/userinfo.dto';
import { User } from '@/entity/user.entity';
import { AuthService } from '@/auth/auth.service';
import { IUserInfoService } from './userinfo.interface';

@Injectable()
export class UserInfoServiceImpl implements IUserInfoService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
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
        email: user.email,
        phone: user.phone,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(`获取用户信息失败: ${  (error as Error).message}`);
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
        email: user.email,
        phone: user.phone,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('获取用户信息失败: ' + (error as Error).message);
    }
  }

  public async registerUser(userRegisterDto: UserRegisterDto): Promise<string> {
    try {
      // 验证用户名格式（3-20个字符，只能包含字母、数字、下划线）
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(userRegisterDto.username)) {
        throw new BadRequestException('用户名格式不正确：3-20个字符，只能包含字母、数字、下划线');
      }

      // 验证密码强度（至少6个字符）
      if (userRegisterDto.password.length < 6) {
        throw new BadRequestException('密码长度至少6个字符');
      }

      // 检查用户是否已存在
      const existingUser = await this.userRepository.findOne({
        where: { username: userRegisterDto.username },
      });

      if (existingUser) {
        throw new ConflictException('用户名已存在');
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

      // 创建新用户（使用哈希密码）
      const hashed = await bcrypt.hash(userRegisterDto.password, 10);
      const newUser = new User();
      newUser.username = userRegisterDto.username;
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
      throw new BadRequestException('注册失败: ' + (error as Error).message);
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
      throw new BadRequestException(`登录失败: ${  (error as Error).message}`);
    }
  }
}
