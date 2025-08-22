import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';

export enum UserRole {
    ADMIN = 'admin',
    SELLER = 'seller',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string; // UUID primary key

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 150, unique: true })
    email: string; // login / unique

    // Exclude select by default for safety (won't be returned unless explicitly requested)
    @Column({ type: 'varchar', length: 255, select: false })
    password: string; // hashed password

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.SELLER,
    })
    role: UserRole;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @OneToMany(() => Customer, (customer) => customer.seller)
    customers?: Customer[];
}