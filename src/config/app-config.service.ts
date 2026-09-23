import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment, EnvironmentVariables } from './env.validation.js';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  get nodeEnv(): Environment {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get isProduction(): boolean {
    return this.nodeEnv === Environment.Production;
  }

  get isTest(): boolean {
    return this.nodeEnv === Environment.Test;
  }

  get port(): number {
    return this.configService.get('PORT', { infer: true });
  }

  get dbHost(): string {
    return this.configService.get('DB_HOST', { infer: true });
  }

  get dbPort(): number {
    return this.configService.get('DB_PORT', { infer: true });
  }

  get dbUsername(): string {
    return this.configService.get('DB_USERNAME', { infer: true });
  }

  get dbPassword(): string {
    return this.configService.get('DB_PASSWORD', { infer: true });
  }

  get dbName(): string {
    return this.configService.get('DB_NAME', { infer: true });
  }

  get jwtAccessSecret(): string {
    return this.configService.get('JWT_ACCESS_SECRET', { infer: true });
  }

  get jwtAccessExpiresIn(): string {
    return this.configService.get('JWT_ACCESS_EXPIRES_IN', { infer: true });
  }

  get jwtRefreshSecret(): string {
    return this.configService.get('JWT_REFRESH_SECRET', { infer: true });
  }

  get jwtRefreshExpiresIn(): string {
    return this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true });
  }
}