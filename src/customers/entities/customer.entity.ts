import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CustomerAddress } from './customer-address.entity';
import { Order } from 'src/orders/entities/order.entity';
// import { Order } from '../../orders/entities/order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  // NIT / tax identification number
  @Column({ type: 'varchar', length: 100, nullable: true })
  taxId: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  contactPerson: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => CustomerAddress, (address) => address.customer, {
    cascade: true,
  })
  addresses: CustomerAddress[];

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
