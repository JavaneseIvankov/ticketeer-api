import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../../../config/app-config.service.js';
import { UserRole } from '../../../common/enums/index.js';
import { User } from '../../users/entities/user.entity.js';
import { UsersRepository } from '../../users/domain/ports/user.repository.ports.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: AppConfigService,
    private readonly usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtAccessSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException(
        'Sesi tidak valid: Pengguna tidak lagi terdaftar.',
      );
    }
    return user;
  }
}