import { Controller, Post, UseGuards, Param, Body, Request, HttpCode, Get, Put } from '@nestjs/common';
import { CreateDto, ReadyDto, ScoreDto } from './dto/rooms.dto';
import { RoomsService } from './rooms.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('room')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createDto: CreateDto, @Request() req) {
    return this.roomsService.create(createDto, req.user);
  }

  @Post('enter')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  enter(@Body() createDto: CreateDto, @Request() req) {
    return this.roomsService.enter(createDto.name, req.user);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  getRoom(@Param() params) {
    return this.roomsService.getById(params.id);
  }
}
