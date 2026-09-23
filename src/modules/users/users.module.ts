import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';

// TODO: add user repo impl to providers
@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
