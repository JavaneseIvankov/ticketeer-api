import { User } from '../../entities/user.entity.js';
import { UserRole } from '../../../../common/enums/index.js';

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}

export interface UpdateUserData {
  fullName?: string;
  password?: string;
}

export abstract class UsersRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(data: CreateUserData): Promise<User>;
  abstract update(id: string, data: UpdateUserData): Promise<User>;
  abstract updateRefreshToken(
    id: string,
    hashedRefreshToken: string | null,
  ): Promise<void>;
}