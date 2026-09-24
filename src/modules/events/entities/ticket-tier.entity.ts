import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
    type Relation,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity.js';
import { Ticket } from '../../tickets/entities/ticket.entity.js';
import { Event } from './event.entity.js';

@Entity('ticket_tiers')
@Unique(['eventId', 'name'])
@Check('"availableQuota" >= 0')
@Check('"totalQuota" >= 0')
@Check('"price" >= 0')
@Check('"salesEnd" > "salesStart"')
export class TicketTier {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  eventId!: string;

  @ManyToOne(() => Event, (event) => event.tiers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Relation<Event>;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  price!: number;

  @Column({ type: 'int' })
  totalQuota!: number;

  @Column({ type: 'int' })
  availableQuota!: number;

  @Column({ type: 'int', default: 4 })
  maxPerUser!: number;

  @Column({ type: 'timestamptz' })
  salesStart!: Date;

  @Column({ type: 'timestamptz' })
  salesEnd!: Date;

  @OneToMany(() => Order, (order) => order.tier)
  orders!: Relation<Order>[];

  @OneToMany(() => Ticket, (ticket) => ticket.tier)
  tickets!: Relation<Ticket>[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}