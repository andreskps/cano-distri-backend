import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('order_products')
export class OrderProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.orderProducts, { nullable: false, onDelete: 'CASCADE' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderProducts, { nullable: false, onDelete: 'RESTRICT' })
  product: Product;

  @Column({ type: 'numeric', precision: 14, scale: 3, default: 1 })
  quantity: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  unitPrice: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}