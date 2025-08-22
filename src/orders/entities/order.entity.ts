import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Column,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { CustomerAddress } from '../../customers/entities/customer-address.entity';
import { User } from '../../users/entities/user.entity';
import { OrderProduct } from './order-product.entity';
import { OrderStatusHistory } from './order-status-history.entity';
import { OrderStatus } from './order-status.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, length: 50 })
  code: string;

  @ManyToOne(() => Customer, { nullable: false, onDelete: 'CASCADE' })
  customer: Customer;

  @ManyToOne(() => CustomerAddress, { nullable: true, onDelete: 'SET NULL' })
  address: CustomerAddress | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User | null; // seller who created the order

  @Column({ type: 'date', nullable: true })
  deliveryDate: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @OneToMany(() => OrderProduct, (op) => op.order, { cascade: true })
  orderProducts: OrderProduct[];

  @OneToMany(() => OrderStatusHistory, (h) => h.order, { cascade: true })
  statusHistory: OrderStatusHistory[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}