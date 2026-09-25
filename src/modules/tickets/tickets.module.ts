import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
})
export class TicketsModule {}
