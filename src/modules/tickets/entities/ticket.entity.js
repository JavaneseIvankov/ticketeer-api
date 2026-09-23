var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
import { TicketStatus } from '../../../common/enums/index.js';
import { Order } from '../../orders/entities/order.entity.js';
import { TicketTier } from '../../events/entities/ticket-tier.entity.js';
import { Event } from '../../events/entities/event.entity.js';
let Ticket = class Ticket {
    id;
    orderId;
    order;
    ticketTierId;
    tier;
    eventId;
    event;
    ticketCode;
    attendeeName;
    pricePaid;
    status;
    issuedAt;
    admittedAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Ticket.prototype, "id", void 0);
__decorate([
    Column({ type: 'uuid' }),
    Index(),
    __metadata("design:type", String)
], Ticket.prototype, "orderId", void 0);
__decorate([
    ManyToOne(() => Order, (order) => order.tickets, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'orderId' }),
    __metadata("design:type", Object)
], Ticket.prototype, "order", void 0);
__decorate([
    Column({ type: 'uuid' }),
    Index(),
    __metadata("design:type", String)
], Ticket.prototype, "ticketTierId", void 0);
__decorate([
    ManyToOne(() => TicketTier, (tier) => tier.tickets, { onDelete: 'RESTRICT' }),
    JoinColumn({ name: 'ticketTierId' }),
    __metadata("design:type", Object)
], Ticket.prototype, "tier", void 0);
__decorate([
    Column({ type: 'uuid' }),
    Index(),
    __metadata("design:type", String)
], Ticket.prototype, "eventId", void 0);
__decorate([
    ManyToOne(() => Event, (event) => event.tickets, { onDelete: 'RESTRICT' }),
    JoinColumn({ name: 'eventId' }),
    __metadata("design:type", Object)
], Ticket.prototype, "event", void 0);
__decorate([
    Column({ unique: true, length: 64 }),
    Index(),
    __metadata("design:type", String)
], Ticket.prototype, "ticketCode", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], Ticket.prototype, "attendeeName", void 0);
__decorate([
    Column({ type: 'numeric', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], Ticket.prototype, "pricePaid", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: TicketStatus,
        default: TicketStatus.ISSUED,
    }),
    Index(),
    __metadata("design:type", String)
], Ticket.prototype, "status", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Ticket.prototype, "issuedAt", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Ticket.prototype, "admittedAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Ticket.prototype, "updatedAt", void 0);
Ticket = __decorate([
    Entity('tickets'),
    Check('"pricePaid" >= 0')
], Ticket);
export { Ticket };
//# sourceMappingURL=ticket.entity.js.map