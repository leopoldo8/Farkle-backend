import { Controller, Post, UseGuards, Param, Body, Request, HttpCode, Get, Put } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateDto, ReadyDto, ScoreDto } from './dto/rooms.dto';
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

  @Put(':id/ready')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  readyPlayer(@Param() readyDto: ReadyDto, @Request() req) {
    return this.roomsService.ready(readyDto.id, req.user);
  }

  @Put(':id/unready')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  unreadyPlayer(@Param() readyDto: ReadyDto, @Request() req) {
    return this.roomsService.unready(readyDto.id, req.user);
  }

  @Put(':id/roll')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  rollPlayerDice(@Param() readyDto: ReadyDto, @Request() req) {
    return this.roomsService.rollDice(readyDto.id, req.user);
  }

  @Put(':id/score')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  score(@Param() readyDto: ReadyDto, @Body() scoreDto: ScoreDto, @Request() req) {
    return this.roomsService.score(scoreDto.dicesSelected, readyDto.id, req.user);
  }
}
