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
    UpdateDateColumn,
    type Relation,
} from 'typeorm';
import { OrderStatus } from '../../../common/enums/index.js';
import { TicketTier } from '../../events/entities/ticket-tier.entity.js';
import { Ticket } from '../../tickets/entities/ticket.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('orders')
@Check('"quantity" > 0')
@Check('"totalAmount" >= 0')
@Index(['customerId', 'ticketTierId', 'status'])
@Index(['status', 'expiresAt'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // https://community.shopify.com/t/max-length-for-fields-order-id-and-order-number-of-order-object/64390
  @Column({ unique: true, length: 20 })
  @Index()
  orderNumber!: string;

  @Column({ type: 'uuid' })
  @Index()
  customerId!: string;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customerId' })
  customer!: Relation<User>;

  @Column({ type: 'uuid' })
  @Index()
  ticketTierId!: string;

  @ManyToOne(() => TicketTier, (tier) => tier.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ticketTierId' })
  tier!: Relation<TicketTier>;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  totalAmount!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_PAYMENT,
  })
  @Index()
  status!: OrderStatus;

  @Column({ type: 'timestamptz' })
  @Index()
  expiresAt!: Date;

  // UUID = 32 chars, tambahkan 4 chars untuk '-' separator
  @Column({ type: 'varchar', length: 36, unique: true, nullable: true })
  @Index()
  idempotencyKey!: string | null;

  @OneToMany(() => Ticket, (ticket) => ticket.order, { cascade: true })
  tickets!: Relation<Ticket>[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}