import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service.js';
import { OrdersRepository } from './domain/ports/orders-repository.port.js';
import { TypeOrmOrdersRepository } from './infra/typeorm-orders.repository.js';
import { Order } from './entities/order.entity.js';
import { TicketTier } from '../events/entities/ticket-tier.entity.js';
import { Ticket } from '../tickets/entities/ticket.entity.js';
import { EventsModule } from '../events/events.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, TicketTier, Ticket]),
    EventsModule,
  ],
  providers: [
    OrdersService,
    {
      provide: OrdersRepository,
      useClass: TypeOrmOrdersRepository,
    },
  ],
  exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
