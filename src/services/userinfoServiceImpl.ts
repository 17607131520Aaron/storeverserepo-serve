import { Injectable, BadRequestException, UnauthorizedException, HttpException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInfoResponseDto, UserInfoDto, UserLoginResponseDto } from '@/dto/userinfo.dto';
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

  public async getUserInfo(): Promise<UserInfoResponseDto> {
    try {
      // 从数据库获取用户信息
      const user = await this.userRepository.findOne({
        where: { username: 'admin' },
      });

      if (user) {
        return {
          username: user.username,
          password: user.password,
        };
      }

      // 如果数据库中没有用户，返回默认值
      return {
        username: 'admin',
        password: '123456',
      };
    } catch (error) {
      throw new BadRequestException('获取用户信息失败: ' + (error as Error).message);
    }
  }

  public async registerUser(): Promise<string> {
    try {
      // 检查用户是否已存在
      const existingUser = await this.userRepository.findOne({
        where: { username: 'admin' },
      });

      if (existingUser) {
        return '用户已存在';
      }

      // 创建新用户（使用哈希密码）
      const hashed = await bcrypt.hash('123456', 10);
      const newUser = this.userRepository.create({
        username: 'admin',
        password: hashed,
        email: 'admin@example.com',
        status: 1,
      });

      await this.userRepository.save(newUser);
      return '注册成功';
    } catch (error) {
      throw new BadRequestException('注册失败: ' + (error as Error).message);
    }
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
      throw new BadRequestException('登录失败: ' + (error as Error).message);
    }
  }
}
