import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../common/enums/index.js';

export class RegisterDto {
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong.' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal teridir dari 6 karakter.' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong.' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong.' })
  fullName!: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role harus bernilai ORGANIZER atau CUSTOMER.' })
  role?: UserRole = UserRole.CUSTOMER;

}

