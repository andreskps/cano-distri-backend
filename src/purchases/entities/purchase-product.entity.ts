import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Purchase } from './purchase.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('purchase_products')
export class PurchaseProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Purchase, (purchase) => purchase.purchaseProducts, { 
    nullable: false, 
    onDelete: 'CASCADE' 
  })
  purchase: Purchase;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  product: Product;

  @Column({ type: 'int', default: 1 })
  quantityOrdered: number; // Cantidad pedida

  @Column({ type: 'int', default: 0 })
  quantityReceived: number; // Cantidad recibida

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  unitCost: string; // Costo unitario

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  taxRate: string; // Porcentaje de impuesto

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  discountAmount: string; // Descuento por línea

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  subtotal: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}