import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateDto } from './dto/sheet.dto';
import { SheetsService } from './sheets.service';

@Controller('sheets')
export class SheetsController {
  constructor(private readonly sheetService: SheetsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() create: CreateDto, @Request() req, hoursPerDay?: number) {
    return this.sheetService.create(create, req.user, hoursPerDay);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async listByUser(@Request() req) {
    return this.sheetService.list(req.user.userId);
  }
}
