import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { CustomerQueryParams, PaginationDto } from './dto/pagination.dto';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { getBogotaDate } from '../common/business-date';
import { buildRuteroWorkbook, RuteroCustomer, RuteroOrder } from './rutero/rutero.builder';

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
    @InjectRepository(CustomerAddress)
    private readonly customerAddressRepository: Repository<CustomerAddress>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto, seller: User): Promise<Customer> {
    // Validaciones y limpieza básica
    const name = createCustomerDto.name?.trim();
    const email = createCustomerDto.email?.trim().toLowerCase();
    const phone = createCustomerDto.phone?.trim();

    if (!name) {
      throw new BadRequestException('El nombre del cliente es requerido');
    }

    if (!email) {
      throw new BadRequestException('El correo del cliente es requerido');
    }

    // Verificar duplicados por correo
    const existing = await this.customerRepository.findOne({
      where: [
        { email },
      ],
    });

    if (existing) {
      throw new BadRequestException('Ya existe un cliente con ese email');
    }

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      name,
      email,
      phone,
      seller, // Asignar el vendedor actual
    });

    try {
      return await this.customerRepository.save(customer);
    } catch (error) {
      // Log limitado para depuración
      console.error('Error creando cliente:', {
        message: error?.message ?? String(error),
      });

      // Detectar constraint unique de PG u otros errores predecibles
      const msg = error?.message ?? '';
      if (/unique|duplicate|23505/i.test(msg)) {
        throw new BadRequestException('Ya existe un cliente con ese email o teléfono');
      }

      throw new InternalServerErrorException('Error al crear cliente. Intenta nuevamente.');
    }
  }

  async findAll(
    queryParams: CustomerQueryParams,
    user: User,
  ): Promise<PaginatedResponse<Customer>> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = queryParams;
    
    const skip = (page - 1) * limit;

    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.seller', 'seller')
      .leftJoinAndSelect('customer.addresses', 'addresses')
      // Siempre filtrar solo clientes activos
      .where('customer.isActive = :isActive', { isActive: true });

    // Agregar búsqueda si está presente
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      const searchCondition = `
        (customer.name ILIKE :searchTerm OR 
         customer.email ILIKE :searchTerm OR 
         customer.phone ILIKE :searchTerm )
      `;
      
  // Añadir condición de búsqueda sin sobrescribir el filtro de isActive
  queryBuilder.andWhere(searchCondition, { searchTerm });
    }

    const [customers, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy(`customer.${sortBy}`, sortOrder)
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
      .where('customer.id = :id', { id })
      .andWhere('customer.isActive = :isActive', { isActive: true });

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
    await this.customerRepository.update(id, { isActive: false });
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return await this.customerRepository.findOne({
      where: { email, isActive: true },
      relations: ['seller', 'addresses'],
    });
  }

  async findBySeller(sellerId: string, paginationDto: PaginationDto): Promise<PaginatedResponse<Customer>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [customers, total] = await this.customerRepository.findAndCount({
      where: { seller: { id: sellerId }, isActive: true },
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

  /**
   * Rutero de clientes activos en Excel. Mismo alcance que findAll:
   * todos los clientes activos, para admin y seller.
   */
  async getRutero(_user: User): Promise<{ buffer: Buffer; filename: string }> {
    const customers: RuteroCustomer[] = await this.customerRepository.query(
      `WITH dir_pedido AS (
         SELECT DISTINCT ON (o."customerId") o."customerId", o."addressId"
         FROM orders o
         WHERE o."addressId" IS NOT NULL AND o.status <> $1
         ORDER BY o."customerId", o."createdAt" DESC
       ),
       dir_ultima AS (
         SELECT DISTINCT ON (ca."customerId") ca."customerId", ca.id AS "addressId"
         FROM customer_addresses ca
         WHERE ca."customerId" IS NOT NULL
         ORDER BY ca."customerId", ca."createdAt" DESC
       )
       SELECT c.id, c.name, c."taxId", c.phone, c.email, c."contactPerson", a.address, a.city
       FROM customers c
       LEFT JOIN dir_pedido dp ON dp."customerId" = c.id
       LEFT JOIN dir_ultima du ON du."customerId" = c.id
       LEFT JOIN customer_addresses a ON a.id = COALESCE(dp."addressId", du."addressId")
       WHERE c."isActive" = true`,
      [OrderStatus.CANCELLED],
    );

    const orders: RuteroOrder[] = await this.customerRepository.query(
      `SELECT o."customerId", o."createdAt", o.status
       FROM orders o
       JOIN customers c ON c.id = o."customerId"
       WHERE c."isActive" = true AND o.status <> $1`,
      [OrderStatus.CANCELLED],
    );

    return {
      buffer: buildRuteroWorkbook(customers, orders),
      filename: `Rutero_Clientes_${getBogotaDate()}.xlsx`,
    };
  }

  // ==================== MÉTODOS PARA DIRECCIONES ====================

  /**
   * Añadir una nueva dirección a un cliente
   */
  async addAddress(
    customerId: string, 
    createAddressDto: CreateCustomerAddressDto, 
    user: User
  ): Promise<CustomerAddress> {
    // Verificar que el cliente existe y pertenece al vendedor
    const customer = await this.findOne(customerId, user);

    const address = this.customerAddressRepository.create({
      ...createAddressDto,
      customer,
    });

    return await this.customerAddressRepository.save(address);
  }

  /**
   * Obtener todas las direcciones de un cliente
   */
  async getCustomerAddresses(customerId: string, user: User): Promise<CustomerAddress[]> {
    // Verificar que el cliente existe y pertenece al vendedor
    await this.findOne(customerId, user);

    return await this.customerAddressRepository.find({
      where: { customer: { id: customerId } },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener una dirección específica
   */
  async getAddress(customerId: string, addressId: string, user: User): Promise<CustomerAddress> {
    // Verificar que el cliente existe y pertenece al vendedor
    await this.findOne(customerId, user);

    const address = await this.customerAddressRepository.findOne({
      where: { 
        id: addressId, 
        customer: { id: customerId } 
      },
      relations: ['customer'],
    });

    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    return address;
  }

  /**
   * Actualizar una dirección existente
   */
  async updateAddress(
    customerId: string, 
    addressId: string, 
    updateAddressDto: UpdateCustomerAddressDto, 
    user: User
  ): Promise<CustomerAddress> {
    // Verificar que la dirección existe y pertenece al cliente del vendedor
    await this.getAddress(customerId, addressId, user);

    await this.customerAddressRepository.update(addressId, updateAddressDto);

    return await this.getAddress(customerId, addressId, user);
  }

  /**
   * Eliminar una dirección
   */
  async removeAddress(customerId: string, addressId: string, user: User): Promise<void> {
    // Verificar que la dirección existe y pertenece al cliente del vendedor
    await this.getAddress(customerId, addressId, user);

    await this.customerAddressRepository.delete(addressId);
  }
}
