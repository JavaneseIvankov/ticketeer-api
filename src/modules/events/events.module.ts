import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';
import { EventsRepository } from './domain/ports/events-repository.port.js';
import { TypeOrmEventsRepository } from './infra/typeorm-events.repository.js';
import { Event } from './entities/event.entity.js';
import { TicketTier } from './entities/ticket-tier.entity.js';
import { Ticket } from '../tickets/entities/ticket.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Event, TicketTier, Ticket])],
  controllers: [EventsController],
  providers: [
    EventsService,
    {
      provide: EventsRepository,
      useClass: TypeOrmEventsRepository,
    },
  ],
  exports: [EventsService, EventsRepository],
})
export class EventsModule {}
