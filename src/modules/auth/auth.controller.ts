import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { AuthResponse, AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

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
}
