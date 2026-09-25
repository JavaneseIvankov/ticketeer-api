import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import { UsersRepository } from '../users/domain/ports/user.repository.ports.js';
import { AppConfigService } from '../../config/app-config.service.js';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: vi.fn(),
            create: vi.fn(),
            findById: vi.fn(),
            updateRefreshToken: vi.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: vi.fn(),
            verifyAsync: vi.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            jwtAccessSecret: 'test-secret',
            jwtAccessExpiresIn: '15m',
            jwtRefreshSecret: 'test-refresh-secret',
            jwtRefreshExpiresIn: '7d',
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
