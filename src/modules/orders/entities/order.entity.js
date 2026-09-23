var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
import { OrderStatus } from '../../../common/enums/index.js';
import { TicketTier } from '../../events/entities/ticket-tier.entity.js';
import { Ticket } from '../../tickets/entities/ticket.entity.js';
import { User } from '../../users/entities/user.entity.js';
let Order = class Order {
    id;
    orderNumber;
    customerId;
    customer;
    ticketTierId;
    tier;
    quantity;
    totalAmount;
    status;
    expiresAt;
    idempotencyKey;
    tickets;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Order.prototype, "id", void 0);
__decorate([
    Column({ unique: true, length: 20 }),
    Index(),
    __metadata("design:type", String)
], Order.prototype, "orderNumber", void 0);
__decorate([
    Column({ type: 'uuid' }),
    Index(),
    __metadata("design:type", String)
], Order.prototype, "customerId", void 0);
__decorate([
    ManyToOne(() => User, (user) => user.orders, { onDelete: 'RESTRICT' }),
    JoinColumn({ name: 'customerId' }),
    __metadata("design:type", Object)
], Order.prototype, "customer", void 0);
__decorate([
    Column({ type: 'uuid' }),
    Index(),
    __metadata("design:type", String)
], Order.prototype, "ticketTierId", void 0);
__decorate([
    ManyToOne(() => TicketTier, (tier) => tier.orders, { onDelete: 'RESTRICT' }),
    JoinColumn({ name: 'ticketTierId' }),
    __metadata("design:type", Object)
], Order.prototype, "tier", void 0);
__decorate([
    Column({ type: 'int' }),
    __metadata("design:type", Number)
], Order.prototype, "quantity", void 0);
__decorate([
    Column({ type: 'numeric', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], Order.prototype, "totalAmount", void 0);
__decorate([
    Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING_PAYMENT,
    }),
    Index(),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    Column({ type: 'timestamptz' }),
    Index(),
    __metadata("design:type", Date)
], Order.prototype, "expiresAt", void 0);
__decorate([
    Column({ type: 'varchar', length: 36, unique: true, nullable: true }),
    Index(),
    __metadata("design:type", Object)
], Order.prototype, "idempotencyKey", void 0);
__decorate([
    OneToMany(() => Ticket, (ticket) => ticket.order, { cascade: true }),
    __metadata("design:type", Array)
], Order.prototype, "tickets", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Order.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Order.prototype, "updatedAt", void 0);
Order = __decorate([
    Entity('orders'),
    Check('"quantity" > 0'),
    Check('"totalAmount" >= 0'),
    Index(['customerId', 'ticketTierId', 'status']),
    Index(['status', 'expiresAt'])
], Order);
export { Order };
//# sourceMappingURL=order.entity.js.map