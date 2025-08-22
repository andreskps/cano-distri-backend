import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderStatusHistory } from '../entities/order-status-history.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { ChangeOrderStatusDto, UpdatePaymentStatusDto } from '../dto/order-status.dto';

@Injectable()
export class OrderStatusService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderStatusHistory)
    private readonly statusHistoryRepository: Repository<OrderStatusHistory>,
  ) {}

  async changeOrderStatus(
    orderId: string,
    changeStatusDto: ChangeOrderStatusDto,
    user: User,
  ): Promise<Order> {
    // Buscar el pedido
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Verificar permisos: solo el vendedor que creó el pedido o un admin pueden cambiar el estado
    if (user.role !== UserRole.ADMIN && order.user?.id !== user.id) {
      throw new ForbiddenException('No tienes permisos para modificar este pedido');
    }

    // Guardar el estado anterior para el historial
    const previousStatus = order.status;

    // Actualizar el estado del pedido
    order.status = changeStatusDto.status;
    const updatedOrder = await this.orderRepository.save(order);

    // Crear entrada en el historial de estados
    const statusHistory = this.statusHistoryRepository.create({
      order,
      status: changeStatusDto.status,
      notes: changeStatusDto.notes || `Estado cambiado de ${previousStatus} a ${changeStatusDto.status}`,
      user,
    });

    await this.statusHistoryRepository.save(statusHistory);

    return updatedOrder;
  }

  async updatePaymentStatus(
    orderId: string,
    updatePaymentDto: UpdatePaymentStatusDto,
    user: User,
  ): Promise<Order> {
    // Buscar el pedido
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Verificar permisos: solo el vendedor que creó el pedido o un admin pueden cambiar el estado de pago
    if (user.role !== UserRole.ADMIN && order.user?.id !== user.id) {
      throw new ForbiddenException('No tienes permisos para modificar este pedido');
    }

    // Actualizar el estado de pago
    order.isPaid = updatePaymentDto.isPaid;
    const updatedOrder = await this.orderRepository.save(order);

    // Crear entrada en el historial (opcional, para rastrear cambios de pago)
    const statusHistory = this.statusHistoryRepository.create({
      order,
      status: order.status, // mantener el estado actual
      notes: updatePaymentDto.notes || `Estado de pago cambiado a: ${updatePaymentDto.isPaid ? 'Pagado' : 'No pagado'}`,
      user,
    });

    await this.statusHistoryRepository.save(statusHistory);

    return updatedOrder;
  }

  async getOrderStatusHistory(orderId: string, user: User): Promise<OrderStatusHistory[]> {
    // Buscar el pedido
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Verificar permisos: solo el vendedor que creó el pedido o un admin pueden ver el historial
    if (user.role !== UserRole.ADMIN && order.user?.id !== user.id) {
      throw new ForbiddenException('No tienes permisos para ver este pedido');
    }

    // Obtener historial de estados
    return await this.statusHistoryRepository.find({
      where: { order: { id: orderId } },
      relations: ['user'],
      order: { timestamp: 'DESC' },
    });
  }
}
