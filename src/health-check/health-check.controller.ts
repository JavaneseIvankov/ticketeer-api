import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { DataSource } from 'typeorm'

@Controller('health')
export class HealthCheckController {
   constructor(private readonly ds: DataSource) {}

   @Get()
   async check() {
      try {
         await this.ds.query('SELECT 1');
         return {
            status: 'ok',
            database: 'up',
            timestamp: new Date().toISOString()
         }
      } catch (error) {
         throw  new ServiceUnavailableException({
            status: 'error',
            database: 'down',
            timestamp: new Date().toISOString()
         })
      }
   }
}