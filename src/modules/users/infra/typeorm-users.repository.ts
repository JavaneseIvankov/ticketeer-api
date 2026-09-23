import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '../entities/user.entity.js';
import {
  CreateUserData,
  UpdateUserData,
  UsersRepository,
} from '../domain/ports/user.repository.ports.js';
import { EmailAlreadyRegisteredException } from '../../auth/domain/errors/auth.errors.js';
import { EntityNotFoundException } from '../../../common/errors/generic-domain.exception.js';

@Injectable()
export class TypeOrmUsersRepository extends UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    const user = this.userRepo.create({
      ...data,
      email: data.email.toLowerCase().trim(),
    });
    try {
      return await this.userRepo.save(user);
    } catch (error) {
      // TODO: buat helper untuk handling error yang terkait dengan db
      if (error instanceof QueryFailedError) {
        if (error.driverError?.code === '23505') {
          throw new EmailAlreadyRegisteredException(
            'Email ini sudah terdaftar dalam sistem.',
          );
        }
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    await this.userRepo.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new EntityNotFoundException('User', id);
    }
    return updated;
  }

  async updateRefreshToken(
    id: string,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.userRepo.update(id, { hashedRefreshToken });
  }
}
