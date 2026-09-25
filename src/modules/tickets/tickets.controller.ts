import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service.js';
import { TicketResponseDto } from './dto/ticket-response.dto.js';
import { TicketDetailResponseDto } from './dto/ticket-detail-response.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query-dto.js';
import {
  DataResponse,
  PaginatedResponse,
} from '../../common/dto/api-response.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../common/enums/index.js';
import { User } from '../users/entities/user.entity.js';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('my')
  @Roles([UserRole.CUSTOMER])
  async getMyTickets(
    @CurrentUser() user: User,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<TicketResponseDto>> {
    const result = await this.ticketsService.getMyTickets(user, query);
    return {
      data: result.data.map((t) => TicketResponseDto.fromEntity(t)),
      meta: result.meta,
    };
  }

  @Get(':id')
  async getTicketById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<DataResponse<TicketDetailResponseDto>> {
    const ticket = await this.ticketsService.getTicketById(id, user);
    return { data: TicketDetailResponseDto.fromEntity(ticket) };
  }

  @Get('code/:code')
  async getTicketByCode(
    @Param('code') code: string,
    @CurrentUser() user: User,
  ): Promise<DataResponse<TicketDetailResponseDto>> {
    const ticket = await this.ticketsService.getTicketByCode(code, user);
    return { data: TicketDetailResponseDto.fromEntity(ticket) };
  }
}
