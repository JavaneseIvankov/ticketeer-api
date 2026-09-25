import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { CreateTicketTierDto } from './dto/create-tier.dto.js';
import { UpdateTicketTierDto } from './dto/update-tier.dto.js';
import { EventResponseDto } from './dto/event-response.dto.js';
import { EventDetailResponseDto } from './dto/event-detail-response.dto.js';
import { TicketTierResponseDto } from './dto/ticket-tier-response.dto.js';
import { EventReportsResponseDto } from './dto/event-reports-response.dto.js';
import { TicketResponseDto } from '../tickets/dto/ticket-response.dto.js';
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

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getPublishedEvents(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<EventResponseDto>> {
    const result = await this.eventsService.findPublishedEvents(query);
    return {
      data: result.data.map((e) => EventResponseDto.fromEntity(e)),
      meta: result.meta,
    };
  }

  @Get('organizer/my-events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ORGANIZER])
  async getOrganizerEvents(
    @CurrentUser() user: User,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<EventResponseDto>> {
    const result = await this.eventsService.findOrganizerEvents(user, query);
    return {
      data: result.data.map((e) => EventResponseDto.fromEntity(e)),
      meta: result.meta,
    };
  }

  @Get(':id')
  async getEventById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DataResponse<EventDetailResponseDto>> {
    const event = await this.eventsService.getEventById(id);
    return { data: EventDetailResponseDto.fromEntity(event) };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ORGANIZER])
  async createEvent(
    @CurrentUser() user: User,
    @Body() dto: CreateEventDto,
  ): Promise<DataResponse<EventDetailResponseDto>> {
    const event = await this.eventsService.createEvent(user, dto);
    return { data: EventDetailResponseDto.fromEntity(event) };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ORGANIZER])
  async updateEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateEventDto,
  ): Promise<DataResponse<EventResponseDto>> {
    const event = await this.eventsService.updateEvent(id, user, dto);
    return { data: EventResponseDto.fromEntity(event) };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ORGANIZER])
  async cancelEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<DataResponse<EventResponseDto>> {
    const event = await this.eventsService.cancelEvent(id, user);
    return { data: EventResponseDto.fromEntity(event) };
  }

  @Post(':id/tiers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ORGANIZER])
  async addTicketTier(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: CreateTicketTierDto,
  ): Promise<DataResponse<TicketTierResponseDto>> {
    const tier = await this.eventsService.addTicketTier(id, user, dto);
    return { data: TicketTierResponseDto.fromEntity(tier) };
  }

  @Patch(':id/tiers/:tierId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ORGANIZER])
  async updateTicketTier(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('tierId', ParseUUIDPipe) tierId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateTicketTierDto,
  ): Promise<DataResponse<TicketTierResponseDto>> {
    const tier = await this.eventsService.updateTicketTier(
      id,
      tierId,
      user,
      dto,
    );
    return { data: TicketTierResponseDto.fromEntity(tier) };
  }

  @Get(':id/reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ORGANIZER])
  async getEventReports(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<DataResponse<EventReportsResponseDto>> {
    const report = await this.eventsService.getEventReports(id, user);
    return { data: EventReportsResponseDto.fromReport(report) };
  }

  @Get(':id/attendees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ORGANIZER])
  async getEventAttendees(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<TicketResponseDto>> {
    const result = await this.eventsService.getEventAttendees(id, user, query);
    return {
      data: result.data.map((t) => TicketResponseDto.fromEntity(t)),
      meta: result.meta,
    };
  }

  @Patch(':id/attendees/:ticketId/admit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ORGANIZER])
  async admitAttendee(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @CurrentUser() user: User,
  ): Promise<DataResponse<TicketResponseDto>> {
    const ticket = await this.eventsService.admitAttendee(id, ticketId, user);
    return { data: TicketResponseDto.fromEntity(ticket) };
  }
}
