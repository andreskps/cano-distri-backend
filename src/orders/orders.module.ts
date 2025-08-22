import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderProduct } from './entities/order-product.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderProduct, OrderStatusHistory])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
