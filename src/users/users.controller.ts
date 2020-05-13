import { Controller, Post, Body } from '@nestjs/common';
import { CreateDto } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly UserService: UsersService) {}

  @Post('/signup')
  async create(@Body() createDto: CreateDto) {
    return this.UserService.create(createDto);
  }
}
