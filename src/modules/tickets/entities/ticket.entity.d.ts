import { type Relation } from 'typeorm';
import { TicketStatus } from '../../../common/enums/index.js';
import { Order } from '../../orders/entities/order.entity.js';
import { TicketTier } from '../../events/entities/ticket-tier.entity.js';
import { Event } from '../../events/entities/event.entity.js';
export declare class Ticket {
    id: string;
    orderId: string;
    order: Relation<Order>;
    ticketTierId: string;
    tier: Relation<TicketTier>;
    eventId: string;
    event: Relation<Event>;
    ticketCode: string;
    attendeeName: string;
    pricePaid: number;
    status: TicketStatus;
    issuedAt: Date;
    admittedAt: Date | null;
    updatedAt: Date;
}
