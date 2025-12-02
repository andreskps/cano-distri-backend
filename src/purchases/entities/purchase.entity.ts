
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { User } from '../../users/entities/user.entity';
import { PurchaseProduct } from './purchase-product.entity';
import { PurchaseStatus } from '../enums/purchase-status.enum';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string; // Código interno de compra

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoiceNumber: string | null; // Número de factura del proveedor

  @ManyToOne(() => Supplier, (supplier) => supplier.purchases, { 
    nullable: false, 
    onDelete: 'RESTRICT' 
  })
  supplier: Supplier;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  createdBy: User | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  receivedBy: User | null;

  @Column({ type: 'date', nullable: true })
  purchaseDate: string | null; // Fecha de compra

  @Column({ type: 'date', nullable: true })
  expectedDeliveryDate: string | null; // Fecha esperada de entrega

  @Column({ type: 'date', nullable: true })
  receivedDate: string | null; // Fecha real de recepción

  @Column({ type: 'date', nullable: true })
  dueDate: string | null; // Fecha de vencimiento de pago

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  taxAmount: string; // Impuestos

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  discountAmount: string; // Descuentos

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  shippingCost: string; // Costo de envío

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total: string;

  @Column({ type: 'enum', enum: PurchaseStatus, default: PurchaseStatus.DRAFT })
  status: PurchaseStatus;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'date', nullable: true })
  paidDate: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => PurchaseProduct, (pp) => pp.purchase, { cascade: true })
  purchaseProducts: PurchaseProduct[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}