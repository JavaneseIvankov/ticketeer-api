import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'node:crypto';
import { AppConfigService } from '../../config/app-config.service.js';
import { UsersRepository } from '../users/domain/ports/user.repository.ports.js';
import { User } from '../users/entities/user.entity.js';
import {
    EmailAlreadyRegisteredException,
    InvalidCredentialsException,
    InvalidRefreshTokenException,
    TokenReuseDetectedException,
    TokenRevokedException,
} from './domain/errors/auth.errors.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtPayload } from './strategies/jwt.strategy.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenPair {
  user: Omit<User, 'password' | 'hashedRefreshToken'>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new EmailAlreadyRegisteredException('Email ini sudah terdaftar dalam sistem.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepository.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
      role: dto.role,
    });

    const tokens = await this.generateTokens(user);
    await this.updateHashedRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new InvalidCredentialsException('Kombinasi email atau password salah.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new InvalidCredentialsException('Kombinasi email atau password salah.');
    }

    const tokens = await this.generateTokens(user);
    await this.updateHashedRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.jwtRefreshSecret,
      });
    } catch {
      throw new InvalidRefreshTokenException(
        'Refresh token tidak valid atau telah kedaluwarsa.',
      );
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user || !user.hashedRefreshToken) {
      throw new TokenRevokedException(
        'Sesi telah berakhir atau pengguna telah logout.',
      );
    }

    const preHashed = this.hashToken(refreshToken);
    const isTokenMatch = await bcrypt.compare(
      preHashed,
      user.hashedRefreshToken,
    );
    if (!isTokenMatch) {
      await this.usersRepository.updateRefreshToken(user.id, null);
      throw new TokenReuseDetectedException(
        'Terdeteksi penggunaan refresh token yang tidak sah. Sesi dibatalkan.',
      );
    }

    const newTokens = await this.generateTokens(user);
    await this.updateHashedRefreshToken(user.id, newTokens.refreshToken);

    return newTokens;
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.usersRepository.updateRefreshToken(userId, null);
    return { message: 'Logout berhasil. Sesi telah dibatalkan.' };
  }

  async getMe(userId: string): Promise<Omit<User, 'password' | 'hashedRefreshToken'>> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new InvalidCredentialsException('Pengguna tidak ditemukan.');
    }
    return this.sanitizeUser(user);
  }

  private async generateTokens(user: User): Promise<TokenPair> {
    const basePayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // FIXME: fix these force casting
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...basePayload, jti: randomUUID() },
        {
          secret: this.config.jwtAccessSecret,
          expiresIn: this.config.jwtAccessExpiresIn as any,
        },
      ),
      this.jwtService.signAsync(
        { ...basePayload, jti: randomUUID() },
        {
          secret: this.config.jwtRefreshSecret,
          expiresIn: this.config.jwtRefreshExpiresIn as any,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async updateHashedRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const preHashed = this.hashToken(refreshToken);
    const hashed = await bcrypt.hash(preHashed, 10);
    await this.usersRepository.updateRefreshToken(userId, hashed);
  }

  // sanitasi sensitive info agar tidak bocor ke client
  private sanitizeUser(user: User): Omit<User, 'password' | 'hashedRefreshToken'> {
    const { password: _, hashedRefreshToken, ...sanitized } = user;
    return sanitized;
  }
}

