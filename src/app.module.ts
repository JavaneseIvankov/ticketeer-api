import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppConfigModule } from './config/app-config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthCheckModule } from './health-check/health-check.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';

@Module({
  imports: [
   AppConfigModule,
   DatabaseModule,
   ScheduleModule.forRoot(),
   HealthCheckModule,
   UsersModule,
   AuthModule,
   EventsModule,
   OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
