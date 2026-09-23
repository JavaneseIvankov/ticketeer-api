import { Injectable } from '@nestjs/common';
import { User } from '../database/entities.js';
import { UserRole } from '../common/enums/index.js';

@Injectable()
export class UsersService {
   private user = new User()
   constructor() {
      const now = new Date()
      this.user.id = "d06440e0-48a1-4639-9aa7-a1fb0ae5e565"
      this.user.email = "johndoe@email.com"
      this.user.password = "password"
      this.user.fullName = "John Doe"
      this.user.role = UserRole.CUSTOMER
      this.user.hashedRefreshToken = null
      this.user.orders = []
      this.user.createdAt = now
      this.user.updatedAt = now
   }
   
   async findOne(email: string): Promise<User | undefined> {
      if (email === this.user.email) {
         return this.user
      }
      return undefined
   }
}
