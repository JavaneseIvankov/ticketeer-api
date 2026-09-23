import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersRepository } from './domain/ports/user.repository.ports.js';
import { TypeOrmUsersRepository } from './infra/typeorm-users.repository.js';
import { User } from './entities/user.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';

// TODO: add user repo impl to providers
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    UsersService,
    {
      provide: UsersRepository,
      useClass: TypeOrmUsersRepository,
    },
  ],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
