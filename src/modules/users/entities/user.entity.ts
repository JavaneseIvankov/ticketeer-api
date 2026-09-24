import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    type Relation
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity.js';
import { UserRole } from '../../../common/enums/index.js';
import { Event } from '../../events/entities/event.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ length: 255 })
  fullName!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role!: UserRole;

  // digunakan untuk rotasi access_token
  @Column({ type: 'text', nullable: true })
  hashedRefreshToken!: string | null;

  @OneToMany(() => Event, (event) => event.organizer)
  events!: Relation<Event>[];

  @OneToMany(() => Order, (order) => order.customer)
  orders!: Relation<Order>[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}