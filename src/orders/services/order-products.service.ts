import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderProduct } from '../entities/order-product.entity';
import { Product } from '../../products/entities/product.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { AddProductToOrderDto, UpdateOrderProductDto } from '../dto/order-product.dto';
import { OrderStatus } from '../entities/order-status.enum';

@Injectable()
export class OrderProductsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderProduct)
    private readonly orderProductRepository: Repository<OrderProduct>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async addProductToOrder(
    orderId: string,
    addProductDto: AddProductToOrderDto,
    user: User,
  ): Promise<OrderProduct> {
    // Buscar el pedido
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Verificar permisos: solo el vendedor que creó el pedido o un admin pueden modificarlo
    if (user.role !== UserRole.ADMIN && order.user?.id !== user.id) {
      throw new ForbiddenException('No tienes permisos para modificar este pedido');
    }

    // No se pueden modificar pedidos cancelados o entregados
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('No se puede modificar un pedido cancelado o entregado');
    }

    // Buscar el producto
    const product = await this.productRepository.findOne({
      where: { id: addProductDto.productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado o inactivo');
    }

    // Verificar si el producto ya está en el pedido
    const existingOrderProduct = await this.orderProductRepository.findOne({
      where: { order: { id: orderId }, product: { id: addProductDto.productId } },
    });

    if (existingOrderProduct) {
      throw new BadRequestException('El producto ya está en el pedido. Use la actualización para modificar la cantidad.');
    }

    // Usar precio del DTO o precio del producto
    const unitPrice = addProductDto.unitPrice || product.price || '0';

    // Crear el registro orden-producto
    const orderProduct = this.orderProductRepository.create({
      order,
      product,
      quantity: addProductDto.quantity,
      unitPrice,
    });

    const savedOrderProduct = await this.orderProductRepository.save(orderProduct);

    // Actualizar total del pedido
    await this.updateOrderTotal(orderId);

    return savedOrderProduct;
  }

  async updateOrderProduct(
    orderId: string,
    productId: string,
    updateDto: UpdateOrderProductDto,
    user: User,
  ): Promise<OrderProduct> {
    // Buscar el pedido
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Verificar permisos
    if (user.role !== UserRole.ADMIN && order.user?.id !== user.id) {
      throw new ForbiddenException('No tienes permisos para modificar este pedido');
    }

    // No se pueden modificar pedidos cancelados o entregados
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('No se puede modificar un pedido cancelado o entregado');
    }

    // Buscar el producto en el pedido
    const orderProduct = await this.orderProductRepository.findOne({
      where: { order: { id: orderId }, product: { id: productId } },
      relations: ['product'],
    });

    if (!orderProduct) {
      throw new NotFoundException('Producto no encontrado en el pedido');
    }

    // Actualizar campos si se proporcionan
    if (updateDto.quantity !== undefined) {
      orderProduct.quantity = updateDto.quantity;
    }

    if (updateDto.unitPrice !== undefined) {
      orderProduct.unitPrice = updateDto.unitPrice;
    }

    const updatedOrderProduct = await this.orderProductRepository.save(orderProduct);

    // Actualizar total del pedido
    await this.updateOrderTotal(orderId);

    return updatedOrderProduct;
  }

  async removeProductFromOrder(orderId: string, productId: string, user: User): Promise<void> {
    // Buscar el pedido
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Verificar permisos
    if (user.role !== UserRole.ADMIN && order.user?.id !== user.id) {
      throw new ForbiddenException('No tienes permisos para modificar este pedido');
    }

    // No se pueden modificar pedidos cancelados o entregados
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('No se puede modificar un pedido cancelado o entregado');
    }

    // Buscar y eliminar el producto del pedido
    const result = await this.orderProductRepository.delete({
      order: { id: orderId },
      product: { id: productId },
    });

    if (result.affected === 0) {
      throw new NotFoundException('Producto no encontrado en el pedido');
    }

    // Actualizar total del pedido
    await this.updateOrderTotal(orderId);
  }

  private async updateOrderTotal(orderId: string): Promise<void> {
    // Calcular el nuevo total del pedido
    const orderProducts = await this.orderProductRepository.find({
      where: { order: { id: orderId } },
    });

    const total = orderProducts.reduce((sum, op) => {
      const subtotal = parseFloat(op.unitPrice) * op.quantity;
      return sum + subtotal;
    }, 0);

    // Actualizar el total en el pedido
    await this.orderRepository.update(orderId, { total: total.toFixed(2) });
  }
}
