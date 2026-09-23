import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity.js';
import { TicketTier } from '../../events/entities/ticket-tier.entity.js';
import { Event } from '../../events/entities/event.entity.js';
import { TicketStatus } from '../../../common/enums/index.js';

@Entity('tickets')
@Check('"pricePaid" >= 0')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  orderId!: string;

  @ManyToOne(() => Order, (order) => order.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Relation<Order>;

  @Column({ type: 'uuid' })
  @Index()
  ticketTierId!: string;

  @ManyToOne(() => TicketTier, (tier) => tier.tickets, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ticketTierId' })
  tier!: Relation<TicketTier>;

  @Column({ type: 'uuid' })
  @Index()
  eventId!: string;

  @ManyToOne(() => Event, (event) => event.tickets, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'eventId' })
  event!: Relation<Event>;

  @Column({ unique: true, length: 64 })
  @Index()
  ticketCode!: string;

  @Column({ length: 255 })
  attendeeName!: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  pricePaid!: number;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.ISSUED,
  })
  @Index()
  status!: TicketStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  issuedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  admittedAt!: Date | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}