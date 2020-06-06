import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { RoomsProviders } from './rooms.providers';
import { UsersModule } from '../users/users.module';
import { RoomsGateway } from './rooms.gateway';

@Module({
  imports: [DatabaseModule, AuthModule, PassportModule, UsersModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway, ...RoomsProviders],
  exports: [RoomsService],
})
export class RoomsModule {}
