import { type Relation } from 'typeorm';
import { OrderStatus } from '../../../common/enums/index.js';
import { TicketTier } from '../../events/entities/ticket-tier.entity.js';
import { Ticket } from '../../tickets/entities/ticket.entity.js';
import { User } from '../../users/entities/user.entity.js';
export declare class Order {
    id: string;
    orderNumber: string;
    customerId: string;
    customer: Relation<User>;
    ticketTierId: string;
    tier: Relation<TicketTier>;
    quantity: number;
    totalAmount: number;
    status: OrderStatus;
    expiresAt: Date;
    idempotencyKey: string | null;
    tickets: Relation<Ticket>[];
    createdAt: Date;
    updatedAt: Date;
}
