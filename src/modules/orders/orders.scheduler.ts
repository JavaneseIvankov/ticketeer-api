import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrdersRepository } from './domain/ports/orders-repository.port.js';

@Injectable()
export class OrdersScheduler {
  private readonly logger = new Logger(OrdersScheduler.name);

  constructor(private readonly ordersRepository: OrdersRepository) {}

  @Cron('*/1 * * * *')
  async handleExpiredOrders(): Promise<void> {
    try {
      const count = await this.ordersRepository.releaseExpiredOrders();
      if (count > 0) {
        this.logger.log(
          `[Inventory Cleanup] berhasil membatalkan dan merilis kuota untuk ${count} order yang expired.`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Gagal merilis kuota pesanan kedaluwarsa secara otomatis:',
        error,
      );
    }
  }
}
