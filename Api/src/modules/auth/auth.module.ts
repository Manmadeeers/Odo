import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module.js';
import { AuthSession } from './entities/auth-session.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([AuthSession]), UsersModule],
})
export class AuthModule {}
