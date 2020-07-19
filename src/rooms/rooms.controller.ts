import { Controller, Post, Param, Body, Request, HttpCode, Get, UseGuards } from '@nestjs/common';
import { CreateDto, EnterDto } from './dto/rooms.dto';
import { RoomsService } from './rooms.service';
import { OptionalJwtAuthGuard } from '@common/optionalJwt.guard';

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
  enter(@Body() enterDto: EnterDto, @Request() req) {
    return this.roomsService.enter(enterDto, req.user, true);
  }

  @Get(':id')
  getRoom(@Param() params) {
    return this.roomsService.getById(params.id);
  }
}
