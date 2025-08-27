import { OrderProduct } from 'src/orders/entities/order-product.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: false, unique: true })
  code: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  price: string | null; // price in the smallest unit (e.g. cents)

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  costPrice: string | null; // cost price in the smallest unit (e.g. cents)
  
 

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string | null; // e.g. kg, liter

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => OrderProduct, (op) => op.product)
  orderProducts: OrderProduct[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}