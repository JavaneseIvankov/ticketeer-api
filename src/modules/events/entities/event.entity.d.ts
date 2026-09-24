import { type Relation } from 'typeorm';
import { EventStatus } from '../../../common/enums/index.js';
import { Ticket } from '../../tickets/entities/ticket.entity.js';
import { TicketTier } from './ticket-tier.entity.js';
export declare class Event {
    id: string;
    title: string;
    description: string;
    venue: string;
    eventDate: Date;
    status: EventStatus;
    tiers: Relation<TicketTier>[];
    tickets: Relation<Ticket>[];
    createdAt: Date;
    updatedAt: Date;
}
