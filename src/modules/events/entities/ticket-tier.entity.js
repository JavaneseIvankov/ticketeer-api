var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn, } from 'typeorm';
import { Order } from '../../orders/entities/order.entity.js';
import { Ticket } from '../../tickets/entities/ticket.entity.js';
import { Event } from './event.entity.js';
let TicketTier = class TicketTier {
    id;
    eventId;
    event;
    name;
    price;
    totalQuota;
    availableQuota;
    maxPerUser;
    salesStart;
    salesEnd;
    orders;
    tickets;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], TicketTier.prototype, "id", void 0);
__decorate([
    Column({ type: 'uuid' }),
    Index(),
    __metadata("design:type", String)
], TicketTier.prototype, "eventId", void 0);
__decorate([
    ManyToOne(() => Event, (event) => event.tiers, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'eventId' }),
    __metadata("design:type", Object)
], TicketTier.prototype, "event", void 0);
__decorate([
    Column({ length: 100 }),
    __metadata("design:type", String)
], TicketTier.prototype, "name", void 0);
__decorate([
    Column({ type: 'numeric', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], TicketTier.prototype, "price", void 0);
__decorate([
    Column({ type: 'int' }),
    __metadata("design:type", Number)
], TicketTier.prototype, "totalQuota", void 0);
__decorate([
    Column({ type: 'int' }),
    __metadata("design:type", Number)
], TicketTier.prototype, "availableQuota", void 0);
__decorate([
    Column({ type: 'int', default: 4 }),
    __metadata("design:type", Number)
], TicketTier.prototype, "maxPerUser", void 0);
__decorate([
    Column({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TicketTier.prototype, "salesStart", void 0);
__decorate([
    Column({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TicketTier.prototype, "salesEnd", void 0);
__decorate([
    OneToMany(() => Order, (order) => order.tier),
    __metadata("design:type", Array)
], TicketTier.prototype, "orders", void 0);
__decorate([
    OneToMany(() => Ticket, (ticket) => ticket.tier),
    __metadata("design:type", Array)
], TicketTier.prototype, "tickets", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TicketTier.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TicketTier.prototype, "updatedAt", void 0);
TicketTier = __decorate([
    Entity('ticket_tiers'),
    Unique(['eventId', 'name']),
    Check('"availableQuota" >= 0'),
    Check('"totalQuota" >= 0'),
    Check('"price" >= 0'),
    Check('"salesEnd" > "salesStart"')
], TicketTier);
export { TicketTier };
//# sourceMappingURL=ticket-tier.entity.js.map