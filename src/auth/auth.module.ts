import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { LocalStrategy } from './local.strategy.js';

@Module({
  imports: [UsersModule],
  providers: [AuthService, LocalStrategy]
})
export class AuthModule {}
