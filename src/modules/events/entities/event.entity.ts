import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    type Relation
} from 'typeorm';
import { EventStatus } from '../../../common/enums/index.js';
import { Ticket } from '../../tickets/entities/ticket.entity.js';
import { TicketTier } from './ticket-tier.entity.js';

@Entity('events')
@Index(['status', 'eventDate'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ length: 255 })
  venue!: string;

  @Column({ type: 'timestamptz' })
  eventDate!: Date;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })

  status!: EventStatus;

  @OneToMany(() => TicketTier, (tier) => tier.event, { cascade: true })
  tiers!: Relation<TicketTier>[];

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets!: Relation<Ticket>[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}