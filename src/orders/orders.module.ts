import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderProductsController } from './controllers/order-products.controller';
import { OrderStatusController } from './controllers/order-status.controller';
import { OrderProductsService } from './services/order-products.service';
import { OrderStatusService } from './services/order-status.service';
import { OrderCodeService } from './services/order-code.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderProduct } from './entities/order-product.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerAddress } from 'src/customers/entities/customer-address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderProduct, OrderStatusHistory, Product, Customer,CustomerAddress])],
  controllers: [OrdersController, OrderProductsController, OrderStatusController],
  providers: [OrdersService, OrderProductsService, OrderStatusService, OrderCodeService],
})
export class OrdersModule {}
