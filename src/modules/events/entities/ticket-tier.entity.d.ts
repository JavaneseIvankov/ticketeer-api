import { type Relation } from 'typeorm';
import { Order } from '../../orders/entities/order.entity.js';
import { Ticket } from '../../tickets/entities/ticket.entity.js';
import { Event } from './event.entity.js';
export declare class TicketTier {
    id: string;
    eventId: string;
    event: Relation<Event>;
    name: string;
    price: number;
    totalQuota: number;
    availableQuota: number;
    maxPerUser: number;
    salesStart: Date;
    salesEnd: Date;
    orders: Relation<Order>[];
    tickets: Relation<Ticket>[];
    createdAt: Date;
    updatedAt: Date;
}
