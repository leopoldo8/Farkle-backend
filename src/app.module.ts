import { Module } from '@nestjs/common';
import { SheetsModule } from './sheets/sheets.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [SheetsModule, UsersModule, AuthModule],
})
export class AppModule {};
