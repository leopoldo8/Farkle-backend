
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { User } from './interfaces/user.interface';
import { CreateDto } from './dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { testCredentials } from '@common/secret';
import { Model } from 'mongoose';
const bcrypt = require('bcrypt');

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('USER_MODEL') private readonly UserModel: Model<User>
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

  async createForTesting() {
    const response = await this.create(testCredentials);
    return this.jwtService.decode(response.access_token);
  }

  async create(createDto: CreateDto) {
    if (!createDto.name.match(/^[a-zA-Z ]+$/)) {
      throw new BadRequestException('Make sure your name only contains alphabetic characters and spaces');
    }

    if (createDto.password.length < 8) {
      throw new BadRequestException('Make sure your password is at lest 8 characters long');
    }

    if (createDto.password.replace(/[^0-9]/g,"").length < 3) {
      throw new BadRequestException('Make sure your password include at least one number');
    }

    if (await this.findOne(createDto.email)) {
      throw new BadRequestException('This email already exists');
    }

    const createdUser = new this.UserModel({
      ...createDto,
      password: await bcrypt.hash(createDto.password, 12)
    });

    await createdUser.save();
    const payload = {
      userId: createdUser._id,
      email: createdUser.email
    }

    return {
      access_token: this.jwtService.sign(payload)
    }
  }
}
