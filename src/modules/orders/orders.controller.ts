import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { ReserveTicketDto } from './dto/reserve-ticket.dto.js';
import { PayOrderDto } from './dto/pay-order.dto.js';
import { OrderResponseDto } from './dto/order-response.dto.js';
import { OrderDetailResponseDto } from './dto/order-detail-response.dto.js';
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

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('my')
  @Roles([UserRole.CUSTOMER])
  async getMyOrders(
    @CurrentUser() user: User,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<OrderResponseDto>> {
    const result = await this.ordersService.getMyOrders(user, query);
    return {
      data: result.data.map((o) => OrderResponseDto.fromEntity(o)),
      meta: result.meta,
    };
  }

  @Get(':id')
  async getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<DataResponse<OrderDetailResponseDto>> {
    const order = await this.ordersService.getOrderById(id, user);
    return { data: OrderDetailResponseDto.fromEntity(order) };
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @Roles([UserRole.CUSTOMER])
  async payOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: PayOrderDto,
  ): Promise<DataResponse<OrderResponseDto>> {
    const paidOrder = await this.ordersService.payOrder(id, user, dto);
    return { data: OrderResponseDto.fromEntity(paidOrder) };
  }

  @Delete(':id')
  @Roles([UserRole.CUSTOMER])
  async cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<DataResponse<OrderResponseDto>> {
    const cancelledOrder = await this.ordersService.cancelOrder(id, user);
    return { data: OrderResponseDto.fromEntity(cancelledOrder) };
  }
}

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventReservationsController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post(':id/tiers/:tierId/reserve')
  @Roles([UserRole.CUSTOMER])
  async reserveTickets(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('tierId', ParseUUIDPipe) tierId: string,
    @CurrentUser() user: User,
    @Body() dto: ReserveTicketDto,
  ): Promise<DataResponse<OrderResponseDto>> {
    const order = await this.ordersService.reserveTickets(
      eventId,
      tierId,
      user,
      dto,
    );
    return { data: OrderResponseDto.fromEntity(order) };
  }
}
