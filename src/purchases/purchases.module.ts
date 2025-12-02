import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { Type } from 'class-transformer';
import { Purchase } from './entities/purchase.entity';
import { PurchaseProduct } from './entities/purchase-product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, PurchaseProduct])],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}
