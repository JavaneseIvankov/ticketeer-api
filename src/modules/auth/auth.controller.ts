import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { AuthResponse, AuthService, TokenPair } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

// TODO: extract into common envelope wrapper type
type DataResponse<T> = {
  data: T;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ): Promise<DataResponse<AuthResponse>> {
    const result = await this.authService.register(dto);
    return { data: result };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<DataResponse<AuthResponse>> {
    const result = await this.authService.login(dto);
    return { data: result };
  }

  // TODO: delete this
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  async protectedSection() {
    return { data: 'Hi, this is protected section' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<DataResponse<TokenPair>> {
    const result = await this.authService.refresh(dto.refreshToken);
    return { data: result };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async me(@CurrentUser() user: User) {
    const result = await this.authService.getMe(user.id);
    return { data: result };
  }
}