var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EventStatus } from '../../../common/enums/index.js';
import { Ticket } from '../../tickets/entities/ticket.entity.js';
import { TicketTier } from './ticket-tier.entity.js';
let Event = class Event {
    id;
    title;
    description;
    venue;
    eventDate;
    status;
    tiers;
    tickets;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Event.prototype, "id", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], Event.prototype, "title", void 0);
__decorate([
    Column({ type: 'text' }),
    __metadata("design:type", String)
], Event.prototype, "description", void 0);
__decorate([
    Column({ length: 255 }),
    __metadata("design:type", String)
], Event.prototype, "venue", void 0);
__decorate([
    Column({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Event.prototype, "eventDate", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: EventStatus,
        default: EventStatus.DRAFT,
    }),
    __metadata("design:type", String)
], Event.prototype, "status", void 0);
__decorate([
    OneToMany(() => TicketTier, (tier) => tier.event, { cascade: true }),
    __metadata("design:type", Array)
], Event.prototype, "tiers", void 0);
__decorate([
    OneToMany(() => Ticket, (ticket) => ticket.event),
    __metadata("design:type", Array)
], Event.prototype, "tickets", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Event.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Event.prototype, "updatedAt", void 0);
Event = __decorate([
    Entity('events'),
    Index(['status', 'eventDate'])
], Event);
export { Event };
//# sourceMappingURL=event.entity.js.map