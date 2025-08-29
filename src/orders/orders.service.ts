import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { GetOrdersQueryDto } from './dto/get-orders.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { Order } from './entities/order.entity';
import { OrderProduct } from './entities/order-product.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerAddress } from '../customers/entities/customer-address.entity';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from './entities/order-status.enum';
import { UserRole } from '../users/entities/user.entity';
import { OrderCodeService } from './services/order-code.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderProduct)
    private readonly orderProductRepository: Repository<OrderProduct>,
    @InjectRepository(OrderStatusHistory)
    private readonly statusHistoryRepository: Repository<OrderStatusHistory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerAddress)
    private readonly customerAddressRepository: Repository<CustomerAddress>,
    private readonly orderCodeService: OrderCodeService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User): Promise<Order> {
    // Validaciones previas fuera de la transacción
    await this.validateOrderCreation(createOrderDto, user);

    // Ejecutar toda la creación dentro de una transacción
    return this.dataSource.transaction(async (manager) => {
      try {
        // Verificar que el cliente existe (dentro de la transacción)
        const customer = await manager.findOne(Customer, {
          where: { id: createOrderDto.customerId },
          relations: ['seller'],
        });

        if (!customer) {
          throw new NotFoundException('Cliente no encontrado');
        }

        // Verificar permisos de creación
        if (user.role === UserRole.SELLER && customer.seller?.id !== user.id) {
          throw new ForbiddenException('No tienes permiso para crear pedidos para este cliente');
        }

        // Obtener la dirección de entrega
        const address = await manager.findOne(CustomerAddress, {
          where: { 
            id: createOrderDto.addressId, 
            customer: { id: createOrderDto.customerId } 
          }
        });

        if (!address) {
          throw new BadRequestException('La dirección especificada no pertenece al cliente o no existe');
        }

        // Generar código único para el pedido
        const orderCode = await this.generateUniqueOrderCode(manager);

        // Validar y obtener productos
        const validatedProducts = await this.validateAndGetProducts(
          createOrderDto.products, 
          manager
        );

        // Crear el pedido
        const order = manager.create(Order, {
          code: orderCode,
          customer,
          address,
          user,
          deliveryDate: createOrderDto.deliveryDate,
          notes: createOrderDto.notes,
          status: OrderStatus.PENDING,
          total: '0',
        });

        const savedOrder = await manager.save(Order, order);

        // Crear productos del pedido y calcular total
        const { orderProducts, totalAmount } = await this.createOrderProducts(
          savedOrder,
          validatedProducts,
          manager
        );

        // Actualizar el total del pedido
        savedOrder.total = totalAmount.toString();
        await manager.save(Order, savedOrder);

        // Crear historial de estado inicial
        await this.createInitialStatusHistory(savedOrder, user, manager);

        // Retornar el pedido completo con todas las relaciones
        return await this.getOrderWithRelations(savedOrder.id, user, manager);

      } catch (error) {
        // Log del error para debugging (mensaje y stack limitados)
        console.error('Error al crear pedido:', {
          message: error?.message ?? String(error),
          stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
        });
        
        // Re-lanzar errores conocidos
        if (error instanceof NotFoundException || 
            error instanceof BadRequestException || 
            error instanceof ForbiddenException) {
          throw error;
        }

        // Para errores desconocidos, lanzar error genérico
        throw new BadRequestException('Error al crear el pedido. Intenta nuevamente.');
      }
    });
  }

  /**
   * Validaciones previas que no requieren transacción
   */
  private async validateOrderCreation(createOrderDto: CreateOrderDto, user: User): Promise<void> {
    // Validar que hay productos en el pedido
    if (!createOrderDto.products || createOrderDto.products.length === 0) {
      throw new BadRequestException('El pedido debe contener al menos un producto');
    }

    // Validar que no hay productos duplicados
    const productIds = createOrderDto.products.map(p => p.productId);
    const uniqueProductIds = new Set(productIds);
    if (productIds.length !== uniqueProductIds.size) {
      throw new BadRequestException('No se pueden agregar productos duplicados al pedido');
    }

    // Validar fecha de entrega (no puede ser en el pasado)
    const deliveryDate = new Date(createOrderDto.deliveryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deliveryDate < today) {
      throw new BadRequestException('La fecha de entrega no puede ser en el pasado');
    }

    // Validar que la dirección pertenece al cliente
    const address = await this.customerAddressRepository.findOne({
      where: { 
        id: createOrderDto.addressId, 
        customer: { id: createOrderDto.customerId } 
      },
      relations: ['customer']
    });

    if (!address) {
      throw new BadRequestException('La dirección especificada no pertenece al cliente o no existe');
    }
  }

  /**
   * Genera un código único para el pedido dentro de la transacción
   */
  private async generateUniqueOrderCode(manager: any): Promise<string> {
    // Use QueryBuilder to safely get the last order code. Using `findOne` without a
    // where clause can throw in some TypeORM versions, so prefer an explicit query.
    const lastOrder = await manager
      .createQueryBuilder(Order, 'order')
      .select(['order.code'])
      .orderBy('order.createdAt', 'DESC')
      .getOne();

    return this.orderCodeService.generateSequentialCode(lastOrder?.code);
  }

  /**
   * Valida los productos y obtiene la información completa
   */
  private async validateAndGetProducts(
    productDtos: any[], 
    manager: any
  ): Promise<Array<{ dto: any; product: Product }>> {
    const validatedProducts: Array<{ dto: any; product: Product }> = [];

    for (const productDto of productDtos) {
      // Validar cantidad
      if (productDto.quantity <= 0) {
        throw new BadRequestException(`La cantidad del producto debe ser mayor a 0`);
      }

      // Obtener producto de la base de datos
      const product = await manager.findOne(Product, {
        where: { id: productDto.productId, isActive: true },
      });

      if (!product) {
        throw new BadRequestException(`Producto ${productDto.productId} no encontrado o inactivo`);
      }

      // Validar precio unitario si se proporciona
      if (productDto.unitPrice && productDto.unitPrice <= 0) {
        throw new BadRequestException(`El precio unitario debe ser mayor a 0`);
      }

      validatedProducts.push({ dto: productDto, product });
    }

    return validatedProducts;
  }

  /**
   * Crea los productos del pedido y calcula el total
   */
  private async createOrderProducts(
    order: Order,
    validatedProducts: Array<{ dto: any; product: Product }>,
    manager: any
  ): Promise<{ orderProducts: OrderProduct[]; totalAmount: number }> {
    let totalAmount = 0;
    const orderProducts: OrderProduct[] = [];

    for (const { dto: productDto, product } of validatedProducts) {
      // Determinar precio unitario (viene por DTO o se toma del producto)
      const unitPrice = productDto.unitPrice ?? parseFloat(product.price ?? '0');

      if (unitPrice <= 0) {
        throw new BadRequestException(`Precio inválido para el producto ${product.name}`);
      }

      // Calcular costPrice y profit usando el helper
      const { costPriceValue, profitValue } = this.calculateProductPricing(
        unitPrice, 
        productDto.quantity, 
        product
      );

      const subtotal = unitPrice * productDto.quantity;
      totalAmount += subtotal;

      const orderProduct = manager.create(OrderProduct, {
        order,
        product,
        quantity: productDto.quantity,
        unitPrice: unitPrice.toString(),
        costPrice: costPriceValue,
        profit: profitValue,
        subtotal: subtotal.toString(),
      });

      orderProducts.push(orderProduct);
    }

    // Validar que el total no sea 0
    if (totalAmount <= 0) {
      throw new BadRequestException('El total del pedido debe ser mayor a 0');
    }

    await manager.save(OrderProduct, orderProducts);
    return { orderProducts, totalAmount };
  }

  /**
   * Crea el historial de estado inicial
   */
  private async createInitialStatusHistory(
    order: Order, 
    user: User, 
    manager: any
  ): Promise<void> {
    const statusHistory = manager.create(OrderStatusHistory, {
      order,
      status: OrderStatus.PENDING,
      user,
      notes: 'Pedido creado',
    });

    await manager.save(OrderStatusHistory, statusHistory);
  }

  /**
   * Obtiene el pedido completo con todas las relaciones
   */
  private async getOrderWithRelations(
    orderId: string, 
    user: User, 
    manager: any
  ): Promise<Order> {
    const queryBuilder = manager
      .createQueryBuilder(Order, 'order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.user', 'seller')
      .leftJoinAndSelect('order.orderProducts', 'orderProducts')
      .leftJoinAndSelect('orderProducts.product', 'product')
      .leftJoinAndSelect('order.statusHistory', 'statusHistory')
      .leftJoinAndSelect('statusHistory.user', 'statusUser')
      .where('order.id = :orderId', { orderId })
      .orderBy('statusHistory.timestamp', 'DESC');

    const order = await queryBuilder.getOne();
    
    if (!order) {
      throw new NotFoundException('Error al obtener el pedido creado');
    }

    return order;
  }

  async findAll(
    query: GetOrdersQueryDto, 
    user: User
  ): Promise<PaginatedResponseDto<Order>> {
    const { page = 1, limit = 10, fecha, estado, clienteId, codigo } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.user', 'seller')
      .leftJoinAndSelect('order.orderProducts', 'orderProducts')
      .leftJoinAndSelect('orderProducts.product', 'product');

    // Filtro por rol de usuario
    if (user.role === UserRole.SELLER) {
      queryBuilder.andWhere('order.user.id = :userId', { userId: user.id });
    }

    // Filtros opcionales
    if (fecha) {
      queryBuilder.andWhere('order.deliveryDate = :fecha', { fecha });
    }

    if (estado) {
      queryBuilder.andWhere('order.status = :estado', { estado });
    }

    if (clienteId) {
      queryBuilder.andWhere('order.customer.id = :clienteId', { clienteId });
    }

    if (codigo) {
      const term = `%${codigo}%`;
      queryBuilder.andWhere(
        '(order.code ILIKE :term OR customer.name ILIKE :term OR customer.email ILIKE :term)',
        { term },
      );
    }

    // Paginación
    queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [orders, totalItems] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: orders,
      meta: {
        page,
        limit,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
  
    };
  }

  async findOne(id: string, user: User): Promise<Order> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.user', 'seller')
      .leftJoinAndSelect('order.orderProducts', 'orderProducts')
      .leftJoinAndSelect('orderProducts.product', 'product')
      .leftJoinAndSelect('order.statusHistory', 'statusHistory')
      .leftJoinAndSelect('statusHistory.user', 'statusUser')
      .where('order.id = :id', { id });

    // Filtro por rol de usuario
    if (user.role === UserRole.SELLER) {
      queryBuilder.andWhere('order.user.id = :userId', { userId: user.id });
    }

    const order = await queryBuilder
      .orderBy('statusHistory.timestamp', 'DESC')
      .getOne();

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, user: User): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      try {
        // Obtener el pedido dentro de la transacción con productos
        const order = await this.getOrderForUpdateWithProducts(id, user, manager);

        // Validaciones de negocio
        this.validateOrderUpdate(order, user);

        // Validar campos a actualizar
        await this.validateUpdateData(updateOrderDto, order.customer.id, manager);

        let shouldRecalculateTotal = false;

        // Si se cambia la dirección, obtenerla y validarla
        if (updateOrderDto.addressId) {
          const newAddress = await manager.findOne(CustomerAddress, {
            where: { 
              id: updateOrderDto.addressId, 
              customer: { id: order.customer.id } 
            }
          });

          if (newAddress) {
            order.address = newAddress;
          }
        }

        // Actualizar campos permitidos (excluyendo addressId que ya se manejó)
        const { addressId, ...updateFields } = updateOrderDto;
        Object.assign(order, updateFields);
        
        // Guardar cambios en la orden
        const updatedOrder = await manager.save(Order, order);

        // Recalcular total si es necesario
        if (shouldRecalculateTotal) {
          const newTotal = await this.recalculateOrderTotal(updatedOrder.id, manager);
          updatedOrder.total = newTotal;
          await manager.save(Order, updatedOrder);
        }

        // Crear historial de cambio si hay modificaciones significativas
        if (this.hasSignificantChanges(updateOrderDto)) {
          await this.createUpdateStatusHistory(order, user, updateOrderDto, manager);
        }

        // Retornar el pedido actualizado con todas las relaciones
        return await this.getOrderWithRelations(updatedOrder.id, user, manager);

      } catch (error) {
        console.error('Error al actualizar pedido:', {
          message: error?.message ?? String(error),
          orderId: id
        });
        
        if (error instanceof NotFoundException || 
            error instanceof BadRequestException || 
            error instanceof ForbiddenException) {
          throw error;
        }

        throw new BadRequestException('Error al actualizar el pedido. Intenta nuevamente.');
      }
    });
  }

  /**
   * Obtiene el pedido para actualización con validaciones
   */
  private async getOrderForUpdate(id: string, user: User, manager: any): Promise<Order> {
    const queryBuilder = manager
      .createQueryBuilder(Order, 'order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.user', 'seller')
      .where('order.id = :id', { id });

    // Filtro por rol de usuario
    if (user.role === UserRole.SELLER) {
      queryBuilder.andWhere('order.user.id = :userId', { userId: user.id });
    }

    const order = await queryBuilder.getOne();

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return order;
  }

  /**
   * Obtiene el pedido para actualización incluyendo productos
   */
  private async getOrderForUpdateWithProducts(id: string, user: User, manager: any): Promise<Order> {
    const queryBuilder = manager
      .createQueryBuilder(Order, 'order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.user', 'seller')
      .leftJoinAndSelect('order.orderProducts', 'orderProducts')
      .leftJoinAndSelect('orderProducts.product', 'product')
      .where('order.id = :id', { id });

    // Filtro por rol de usuario
    if (user.role === UserRole.SELLER) {
      queryBuilder.andWhere('order.user.id = :userId', { userId: user.id });
    }

    const order = await queryBuilder.getOne();

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return order;
  }

  /**
   * Validaciones de negocio para la actualización
   */
  private validateOrderUpdate(order: Order, user: User): void {
    // No permitir edición si el pedido ya fue entregado o cancelado
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('No se puede editar un pedido que ya fue entregado');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('No se puede editar un pedido que fue cancelado');
    }

    // Verificar permisos
    if (user.role === UserRole.SELLER && order.user?.id !== user.id) {
      throw new ForbiddenException('No tienes permiso para editar este pedido');
    }
  }

  /**
   * Valida los datos de actualización
   */
  private async validateUpdateData(updateOrderDto: UpdateOrderDto, customerId?: string, manager?: any): Promise<void> {
    // Validar fecha de entrega si se proporciona
    if (updateOrderDto.deliveryDate) {
      const deliveryDate = new Date(updateOrderDto.deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deliveryDate < today) {
        throw new BadRequestException('La fecha de entrega no puede ser en el pasado');
      }
    }

    // Validar que las notas no estén vacías si se proporcionan
    if (updateOrderDto.notes !== undefined && updateOrderDto.notes.trim() === '') {
      throw new BadRequestException('Las notas no pueden estar vacías');
    }

    // Validar dirección si se proporciona
    if (updateOrderDto.addressId && customerId && manager) {
      const address = await manager.findOne(CustomerAddress, {
        where: { 
          id: updateOrderDto.addressId, 
          customer: { id: customerId } 
        }
      });

      if (!address) {
        throw new BadRequestException('La dirección especificada no pertenece al cliente o no existe');
      }
    }
  }

  /**
   * Determina si hay cambios significativos que requieren historial
   */
  private hasSignificantChanges(updateOrderDto: UpdateOrderDto): boolean {
    return !!(updateOrderDto.deliveryDate || updateOrderDto.notes || updateOrderDto.addressId);
  }

  /**
   * Crea historial para cambios de actualización
   */
  private async createUpdateStatusHistory(
    order: Order, 
    user: User, 
    updateOrderDto: UpdateOrderDto,
    manager: any
  ): Promise<void> {
    let notes = 'Pedido actualizado';
    
    if (updateOrderDto.deliveryDate) {
      notes += ` - Nueva fecha de entrega: ${updateOrderDto.deliveryDate}`;
    }
    
    if (updateOrderDto.addressId) {
      notes += ` - Dirección de entrega actualizada`;
    }
    
    if (updateOrderDto.notes) {
      notes += ` - Notas: ${updateOrderDto.notes}`;
    }

    const statusHistory = manager.create(OrderStatusHistory, {
      order,
      status: order.status,
      user,
      notes,
    });

    await manager.save(OrderStatusHistory, statusHistory);
  }

  async remove(id: string, user: User): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      try {
        // Obtener el pedido dentro de la transacción
        const order = await this.getOrderForUpdate(id, user, manager);

        // Validaciones de cancelación
        this.validateOrderCancellation(order, user);

        // Marcar como cancelado en lugar de eliminar físicamente
        order.status = OrderStatus.CANCELLED;
        await manager.save(Order, order);

        // Registrar el cambio en el historial
        await this.createCancellationStatusHistory(order, user, manager);

      } catch (error) {
        console.error('Error al cancelar pedido:', error);
        
        if (error instanceof NotFoundException || 
            error instanceof BadRequestException || 
            error instanceof ForbiddenException) {
          throw error;
        }

        throw new BadRequestException('Error al cancelar el pedido. Intenta nuevamente.');
      }
    });
  }

  /**
   * Validaciones específicas para cancelación de pedidos
   */
  private validateOrderCancellation(order: Order, user: User): void {
    // Solo permitir cancelación si no ha sido entregado
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('No se puede cancelar un pedido que ya fue entregado');
    }

    // No permitir cancelar un pedido ya cancelado
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('El pedido ya se encuentra cancelado');
    }

    // Verificar permisos
    if (user.role === UserRole.SELLER && order.user?.id !== user.id) {
      throw new ForbiddenException('No tienes permiso para cancelar este pedido');
    }

  // Con el modelo actual (pending, delivered, cancelled) no hay estados intermedios
  // que bloqueen la cancelación aparte de 'delivered' y 'cancelled'.
  // Los administradores pueden cancelar cualquier pedido que no esté entregado.
  }

  /**
   * Crea el historial de cancelación
   */
  private async createCancellationStatusHistory(
    order: Order, 
    user: User, 
    manager: any
  ): Promise<void> {
    const statusHistory = manager.create(OrderStatusHistory, {
      order,
      status: OrderStatus.CANCELLED,
      user,
      notes: `Pedido cancelado por ${user.role === UserRole.ADMIN ? 'administrador' : 'vendedor'}`,
    });

    await manager.save(OrderStatusHistory, statusHistory);
  }

  /**
   * Recalcula el total de una orden basado en sus productos
   */
  private async recalculateOrderTotal(orderId: string, manager: any): Promise<string> {
    const orderProducts = await manager.find(OrderProduct, {
      where: { order: { id: orderId } }
    });

    const total = orderProducts.reduce((sum, op) => {
      return sum + parseFloat(op.subtotal || '0');
    }, 0);

    return total.toFixed(2);
  }

  /**
   * Calcula costPrice y profit para un producto específico
   */
  private calculateProductPricing(
    unitPrice: number, 
    quantity: number, 
    product: Product
  ): { costPriceValue: string | null; profitValue: string | null } {
    let costPriceValue: string | null = null;
    let profitValue: string | null = null;
    
    if (product.costPrice !== null && product.costPrice !== undefined) {
      const parsed = parseFloat(product.costPrice as any);
      if (!isNaN(parsed)) {
        costPriceValue = parsed.toFixed(2);
        
        // Calcular ganancia: (precio_venta - precio_costo) * cantidad
        const profitPerUnit = unitPrice - parsed;
        const totalProfit = profitPerUnit * quantity;
        profitValue = totalProfit.toFixed(2);
      }
    }

    return { costPriceValue, profitValue };
  }

  // ==================== GESTIÓN DE PRODUCTOS EN ÓRDENES ====================

  /**
   * Añade un producto a una orden existente
   */
  async addProductToOrder(
    orderId: string, 
    productData: { productId: string; quantity: number; unitPrice?: number }, 
    user: User
  ): Promise<OrderProduct> {
    return this.dataSource.transaction(async (manager) => {
      try {
        // Obtener la orden con productos
        const order = await this.getOrderForUpdateWithProducts(orderId, user, manager);

        // Validar que se puede editar
        this.validateOrderUpdate(order, user);

        // Verificar que el producto no esté ya en la orden
        const existingProduct = order.orderProducts?.find(
          op => op.product.id === productData.productId
        );

        if (existingProduct) {
          throw new BadRequestException('El producto ya existe en este pedido');
        }

        // Obtener el producto
        const product = await manager.findOne(Product, {
          where: { id: productData.productId, isActive: true }
        });

        if (!product) {
          throw new NotFoundException('Producto no encontrado o inactivo');
        }

        // Calcular precios
        const unitPrice = productData.unitPrice ?? parseFloat(product.price ?? '0');
        
        if (unitPrice <= 0) {
          throw new BadRequestException(`Precio inválido para el producto ${product.name}`);
        }

        const { costPriceValue, profitValue } = this.calculateProductPricing(
          unitPrice,
          productData.quantity,
          product
        );

        const subtotal = unitPrice * productData.quantity;

        // Crear el producto de la orden
        const orderProduct = manager.create(OrderProduct, {
          order,
          product,
          quantity: productData.quantity,
          unitPrice: unitPrice.toString(),
          costPrice: costPriceValue,
          profit: profitValue,
          subtotal: subtotal.toString(),
        });

        const savedOrderProduct = await manager.save(OrderProduct, orderProduct);

        // Recalcular total de la orden
        const newTotal = await this.recalculateOrderTotal(orderId, manager);
        await manager.update(Order, orderId, { total: newTotal });

        // Crear historial
        await this.createUpdateStatusHistory(
          order, 
          user, 
          { notes: `Producto añadido: ${product.name} (x${productData.quantity})` } as any,
          manager
        );

        return savedOrderProduct;

      } catch (error) {
        console.error('Error al añadir producto al pedido:', error);
        
        if (error instanceof NotFoundException || 
            error instanceof BadRequestException || 
            error instanceof ForbiddenException) {
          throw error;
        }

        throw new BadRequestException('Error al añadir producto al pedido. Intenta nuevamente.');
      }
    });
  }

  /**
   * Actualiza un producto específico de una orden
   */
  async updateOrderProduct(
    orderId: string,
    orderProductId: string,
    updateData: { quantity?: number; unitPrice?: number },
    user: User
  ): Promise<OrderProduct> {
    return this.dataSource.transaction(async (manager) => {
      try {
        // Obtener la orden
        const order = await this.getOrderForUpdate(orderId, user, manager);
        this.validateOrderUpdate(order, user);

        // Obtener el producto de la orden
        const orderProduct = await manager.findOne(OrderProduct, {
          where: { id: orderProductId, order: { id: orderId } },
          relations: ['product', 'order']
        });

        if (!orderProduct) {
          throw new NotFoundException('Producto no encontrado en este pedido');
        }

        // Actualizar campos
        if (updateData.quantity !== undefined) {
          if (updateData.quantity <= 0) {
            throw new BadRequestException('La cantidad debe ser mayor a 0');
          }
          orderProduct.quantity = updateData.quantity;
        }

        const unitPrice = updateData.unitPrice !== undefined 
          ? updateData.unitPrice 
          : parseFloat(orderProduct.unitPrice);

        if (unitPrice <= 0) {
          throw new BadRequestException('El precio unitario debe ser mayor a 0');
        }

        // Recalcular valores
        const { costPriceValue, profitValue } = this.calculateProductPricing(
          unitPrice,
          orderProduct.quantity,
          orderProduct.product
        );

        const subtotal = unitPrice * orderProduct.quantity;

        orderProduct.unitPrice = unitPrice.toString();
        orderProduct.costPrice = costPriceValue;
        orderProduct.profit = profitValue;
        orderProduct.subtotal = subtotal.toString();

        const savedOrderProduct = await manager.save(OrderProduct, orderProduct);

        // Recalcular total de la orden
        const newTotal = await this.recalculateOrderTotal(orderId, manager);
        await manager.update(Order, orderId, { total: newTotal });

        // Crear historial
        await this.createUpdateStatusHistory(
          order,
          user,
          { notes: `Producto actualizado: ${orderProduct.product.name}` } as any,
          manager
        );

        return savedOrderProduct;

      } catch (error) {
        console.error('Error al actualizar producto del pedido:', error);
        
        if (error instanceof NotFoundException || 
            error instanceof BadRequestException || 
            error instanceof ForbiddenException) {
          throw error;
        }

        throw new BadRequestException('Error al actualizar producto del pedido. Intenta nuevamente.');
      }
    });
  }

  /**
   * Elimina un producto de una orden
   */
  async removeProductFromOrder(
    orderId: string,
    orderProductId: string,
    user: User
  ): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      try {
        // Obtener la orden con productos
        const order = await this.getOrderForUpdateWithProducts(orderId, user, manager);
        this.validateOrderUpdate(order, user);

        // Verificar que la orden tenga más de un producto
        if (order.orderProducts.length <= 1) {
          throw new BadRequestException('No se puede eliminar el último producto del pedido');
        }

        // Obtener el producto de la orden
        const orderProduct = await manager.findOne(OrderProduct, {
          where: { id: orderProductId, order: { id: orderId } },
          relations: ['product']
        });

        if (!orderProduct) {
          throw new NotFoundException('Producto no encontrado en este pedido');
        }

        // Eliminar el producto
        await manager.delete(OrderProduct, orderProductId);

        // Recalcular total de la orden
        const newTotal = await this.recalculateOrderTotal(orderId, manager);
        await manager.update(Order, orderId, { total: newTotal });

        // Crear historial
        await this.createUpdateStatusHistory(
          order,
          user,
          { notes: `Producto eliminado: ${orderProduct.product.name}` } as any,
          manager
        );

      } catch (error) {
        console.error('Error al eliminar producto del pedido:', error);
        
        if (error instanceof NotFoundException || 
            error instanceof BadRequestException || 
            error instanceof ForbiddenException) {
          throw error;
        }

        throw new BadRequestException('Error al eliminar producto del pedido. Intenta nuevamente.');
      }
    });
  }
}
