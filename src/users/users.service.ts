
import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { JWTDecryptedDto } from '@common/dto/jwt.dto';
import { AuthService } from '../auth/auth.service';
import { User } from './interfaces/user.interface';
import { CreateDto, SignDto } from './dto/user.dto';
import { Model } from 'mongoose';
const bcrypt = require('bcrypt');

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_MODEL') private readonly UserModel: Model<User>,
    private readonly authService: AuthService,
  ) {}

  async findById(id: string): Promise<User | undefined> {
    return this.UserModel.findById(id);
  }

  async findOne(email: string): Promise<User | undefined> {
    return this.UserModel.findOne({ email });
  }

  async delete(query: string) {
    return this.UserModel.findOneAndDelete(query);
  }

  async validateUser(email: string, password: string) {
    const user = await this.findOne(email);

    if (!user) {
      return null;
    }

    const res = await bcrypt.compare(password, user.password);

    if (res) {
      return user;
    }

    return null;
  }

  async get(userInfo: JWTDecryptedDto) {
    const user = await this.findById(userInfo.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { email, name, exp } = user;

    const response = {
      email,
      name,
      exp,
    };

    return response;
  }

  async sign(signDto: SignDto) {
    if (signDto.password.length < 8 || signDto.password.replace(/[^0-9]/g,'').length < 3) {
      throw new BadRequestException('Invalid password');
    }

    const { email, password } = signDto;
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new BadRequestException('Email or password is incorrect');
    }

    return this.authService.sign(user._id, user.email);
  }

  async create(createDto: CreateDto) {
    if (!createDto.name.match(/^[a-zA-Z ]+$/)) {
      throw new BadRequestException('Make sure your name only contains alphabetic characters and spaces');
    }

    if (createDto.password.length < 8) {
      throw new BadRequestException('Make sure your password is at lest 8 characters long');
    }

    if (createDto.password.replace(/[^0-9]/g, '').length < 3) {
      throw new BadRequestException('Make sure your password include at least one number');
    }

    if (await this.findOne(createDto.email)) {
      throw new BadRequestException('This email already exists');
    }

    const createdUser = new this.UserModel({
      ...createDto,
      password: await bcrypt.hash(createDto.password, 12),
      exp: 0,
    });

    await createdUser.save();

    return this.authService.sign(createdUser._id, createdUser.email);
  }
}
