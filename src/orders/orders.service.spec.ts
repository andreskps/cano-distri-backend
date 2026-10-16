import { OrdersService } from './orders.service';
import { User } from '../users/entities/user.entity';

describe('OrdersService delivery date validation', () => {
  const addressRepository = { findOne: jest.fn().mockResolvedValue({ id: 'address' }) };
  const service = new OrdersService(
    {} as any, {} as any, {} as any, {} as any, {} as any,
    addressRepository as any, {} as any, {} as any,
  );

  afterEach(() => jest.useRealTimers());

  it.each(['2026-10-15T18:00:00Z', '2026-10-16T00:01:00Z', '2026-10-16T04:59:59Z', '2026-10-16T05:00:00Z'])(
    'applies the same day rule on creation and update at %s', async (instant) => {
      jest.useFakeTimers().setSystemTime(new Date(instant));
      const today = instant === '2026-10-16T05:00:00Z' ? '2026-10-16' : '2026-10-15';
      for (const deliveryDate of [today, '2026-10-17']) {
        await expect((service as any).validateOrderCreation({
          deliveryDate, customerId: 'customer', addressId: 'address',
          products: [{ productId: 'product', quantity: 1 }],
        }, {} as User)).resolves.toBeUndefined();
        await expect((service as any).validateUpdateData({ deliveryDate })).resolves.toBeUndefined();
      }
      await expect((service as any).validateOrderCreation({
        deliveryDate: '2026-10-14', products: [{ productId: 'product', quantity: 1 }],
      }, {} as User)).rejects.toThrow('La fecha de entrega no puede ser en el pasado');
      await expect((service as any).validateUpdateData({ deliveryDate: '2026-10-14' }))
        .rejects.toThrow('La fecha de entrega no puede ser en el pasado');
    },
  );
});
