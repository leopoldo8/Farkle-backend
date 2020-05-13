import { Module } from '@nestjs/common';
import { SheetsController } from './sheets.controller';
import { SheetsService } from './sheets.service';
import { SheetsProviders } from './sheets.providers';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [SheetsController],
  providers: [SheetsService, ...SheetsProviders]
})
export class SheetsModule {};
