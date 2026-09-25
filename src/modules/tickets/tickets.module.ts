import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity.js';
import { TicketsRepository } from './domain/ports/tickets-repository.port.js';
import { TypeOrmTicketsRepository } from './infra/typeorm-tickets.repository.js';
import { TicketsService } from './tickets.service.js';
import { TicketsController } from './tickets.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  controllers: [TicketsController],
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
