import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersProviders } from './users.providers';
import { DatabaseModule } from '../database/database.module';
import JwtModule from '@common/jwt.module';

@Module({
  imports: [DatabaseModule, JwtModule],
  controllers: [UsersController],
  providers: [UsersService, ...UsersProviders],
  exports: [UsersService],
})
export class UsersModule {};
