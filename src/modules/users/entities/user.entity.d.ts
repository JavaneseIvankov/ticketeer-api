import { type Relation } from 'typeorm';
import { UserRole } from '../../../common/enums/index.js';
import { Order } from '../../orders/entities/order.entity.js';
export declare class User {
    id: string;
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    hashedRefreshToken: string | null;
    orders: Relation<Order>[];
    createdAt: Date;
    updatedAt: Date;
}
