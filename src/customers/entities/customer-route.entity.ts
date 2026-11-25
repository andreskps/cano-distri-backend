import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Día y orden de visita guardados manualmente para un cliente (rutero global).
 * Si un cliente no tiene fila, el rutero usa la sugerencia calculada desde sus pedidos.
 */
@Entity('customer_routes')
export class CustomerRoute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  customerId: string;

  @OneToOne(() => Customer, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  /** ISO weekday 1 (lunes) ... 7 (domingo); null = sin día asignado. */
  @Column({ type: 'smallint', nullable: true })
  dayOfWeek: number | null;

  /** Posición de visita dentro del día, empezando en 1. */
  @Column({ type: 'int' })
  visitOrder: number;

  @Column({ type: 'uuid', nullable: true })
  updatedById: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updatedById' })
  updatedBy: User | null;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
