import { Entity, PrimaryGeneratedColumn, Column, Unique, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('inventory')
@Unique(['product'])
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  product: Product;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  reservedQuantity: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  averageCost: string;

  @Column({ type: 'date', nullable: true })
  lastStockDate: string | null;


  @Column({ type: 'int', default: 0 })
  minStock: number; // Stock mínimo (para alertas)


  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  get availableQuantity(): number {
    return this.quantity - this.reservedQuantity;
  }
}