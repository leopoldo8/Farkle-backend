import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SheetsService } from '../sheets/sheets.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/auth.dto';
import { JWTDecryptedDto } from '@common/dto/jwt.dto';
const bcrypt = require('bcrypt');

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly sheetsService: SheetsService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(email);

    if (!user) {
      return null;
    }

    const res = await bcrypt.compare(password, user.password);

    if (res) {
      return user;
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new BadRequestException('Email or password is incorrect');
    }

    const payload = {
      userId: user._id,
      email: user.email
    };

    return {
      access_token: this.jwtService.sign(payload)
    }
  }

  async getUser(userInfo: JWTDecryptedDto) {
    const user = await this.usersService.findById(userInfo.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const todayTime = await this.sheetsService.getHoursToday(userInfo.userId);

    const { email, hoursPerDay, name } = user;
    const response = { email, hoursPerDay, name, todayTime };

    return response;
  }
}
