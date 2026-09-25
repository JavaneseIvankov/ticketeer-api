import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity.js';
import { TicketsRepository } from './domain/ports/tickets-repository.port.js';
import { TypeOrmTicketsRepository } from './infra/typeorm-tickets.repository.js';
import { TicketsService } from './tickets.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  providers: [
    {
      provide: TicketsRepository,
      useClass: TypeOrmTicketsRepository,
    },
    TicketsService,
  ],
  exports: [TicketsService, TicketsRepository],
})
export class TicketsModule {}
