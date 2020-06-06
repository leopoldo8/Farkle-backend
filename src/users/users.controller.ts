import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateDto, SignDto } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly UserService: UsersService) {}

  @Post('/signup')
  async create(@Body() createDto: CreateDto) {
    return this.UserService.create(createDto);
  }

  @Post('/signin')
  async login(@Body() signDto: SignDto) {
    return this.UserService.sign(signDto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req) {
    return this.UserService.get(req.user);
  }
}
