import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppConfigModule } from './config/app-config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthCheckModule } from './health-check/health-check.module.js';

@Module({
  imports: [
   AppConfigModule,
   DatabaseModule,
   HealthCheckModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
