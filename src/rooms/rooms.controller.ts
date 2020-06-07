import { Controller, Post, Param, Body, Request, HttpCode, Get, UseGuards } from '@nestjs/common';
import { CreateDto } from './dto/rooms.dto';
import { RoomsService } from './rooms.service';
import { OptionalJwtAuthGuard } from '@common/jwt.module';

@Controller('room')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post('create')
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() createDto: CreateDto, @Request() req) {
    return this.roomsService.create(createDto, req.user);
  }

  @Post('enter')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(200)
  enter(@Body() createDto: CreateDto, @Request() req) {
    return this.roomsService.enter(createDto, req.user);
  }

  @Get(':id')
  getRoom(@Param() params) {
    return this.roomsService.getById(params.id);
  }
}
