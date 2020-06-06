import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersProviders } from './users.providers';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [DatabaseModule, AuthModule, PassportModule],
  controllers: [UsersController],
  providers: [UsersService, ...UsersProviders],
  exports: [UsersService],
})
export class UsersModule {};
