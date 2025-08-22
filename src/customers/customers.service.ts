import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Customer } from './entities/customer.entity';
import { User, UserRole } from '../users/entities/user.entity';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto, seller: User): Promise<Customer> {
    const customer = this.customerRepository.create({
      ...createCustomerDto,
      seller, // Asignar el vendedor actual
    });

    return await this.customerRepository.save(customer);
  }

  async findAll(
    paginationDto: PaginationDto,
    user: User,
  ): Promise<PaginatedResponse<Customer>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.seller', 'seller')
      .leftJoinAndSelect('customer.addresses', 'addresses');

    // Si es vendedor, solo ve sus clientes
    if (user.role === UserRole.SELLER) {
      queryBuilder.where('customer.seller.id = :sellerId', { sellerId: user.id });
    }
    // Si es admin, ve todos los clientes (no agregamos condición WHERE)

    const [customers, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('customer.createdAt', 'DESC')
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(id: string, user: User): Promise<Customer> {
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.seller', 'seller')
      .leftJoinAndSelect('customer.addresses', 'addresses')
      .where('customer.id = :id', { id });

    // Si es vendedor, verificar que el cliente le pertenece
    if (user.role === UserRole.SELLER) {
      queryBuilder.andWhere('customer.seller.id = :sellerId', { sellerId: user.id });
    }

    const customer = await queryBuilder.getOne();

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, user: User): Promise<Customer> {
    // Verificar que el cliente existe y pertenece al vendedor
    const customer = await this.findOne(id, user);

    // Actualizar el cliente
    await this.customerRepository.update(id, updateCustomerDto);

    // Retornar el cliente actualizado
    return await this.findOne(id, user);
  }

  async remove(id: string, user: User): Promise<void> {
    // Solo administradores pueden eliminar clientes
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar clientes');
    }

    const customer = await this.customerRepository.findOne({ where: { id } });

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Soft delete: marcar como inactivo (podríamos añadir campo isActive a Customer)
    // Por ahora, eliminación física para administradores
    await this.customerRepository.delete(id);
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return await this.customerRepository.findOne({
      where: { email },
      relations: ['seller', 'addresses'],
    });
  }

  async findBySeller(sellerId: string, paginationDto: PaginationDto): Promise<PaginatedResponse<Customer>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [customers, total] = await this.customerRepository.findAndCount({
      where: { seller: { id: sellerId } },
      relations: ['seller', 'addresses'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
