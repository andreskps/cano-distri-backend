import { ApiProperty } from '@nestjs/swagger';

export class SalesStatsDto {
  @ApiProperty({ description: 'Total de ventas en el período', example: 15420.50 })
  totalSales: number;

  @ApiProperty({ description: 'Total de costos en el período', example: 8950.25 })
  totalCosts: number;

  @ApiProperty({ description: 'Ganancia total en el período', example: 6470.25 })
  totalProfit: number;

  @ApiProperty({ description: 'Margen de ganancia promedio (%)', example: 41.95 })
  averageProfitMargin: number;

  @ApiProperty({ description: 'Número total de pedidos', example: 45 })
  totalOrders: number;

  @ApiProperty({ description: 'Número de pedidos entregados', example: 38 })
  deliveredOrders: number;

  @ApiProperty({ description: 'Número de pedidos pendientes', example: 5 })
  pendingOrders: number;

  @ApiProperty({ description: 'Número de pedidos cancelados', example: 2 })
  cancelledOrders: number;

  @ApiProperty({ description: 'Valor promedio de pedido', example: 342.68 })
  averageOrderValue: number;

  @ApiProperty({ description: 'Total de productos vendidos (unidades)', example: 1250 })
  totalProductsSold: number;
}

export class TopProductDto {
  @ApiProperty({ description: 'ID del producto' })
  productId: string;

  @ApiProperty({ description: 'Nombre del producto', example: 'Coca Cola 600ml' })
  productName: string;

  @ApiProperty({ description: 'Código del producto', example: 'CC-600' })
  productCode: string;

  @ApiProperty({ description: 'Total de unidades vendidas', example: 150 })
  totalQuantitySold: number;

  @ApiProperty({ description: 'Total de ingresos por este producto', example: 3750.00 })
  totalRevenue: number;

  @ApiProperty({ description: 'Ganancia total por este producto', example: 1125.00 })
  totalProfit: number;
}

export class TopCustomerDto {
  @ApiProperty({ description: 'ID del cliente' })
  customerId: string;

  @ApiProperty({ description: 'Nombre del cliente', example: 'Supermercado La Esquina' })
  customerName: string;

  @ApiProperty({ description: 'Total de pedidos realizados', example: 12 })
  totalOrders: number;

  @ApiProperty({ description: 'Total gastado por el cliente', example: 4580.50 })
  totalSpent: number;

  @ApiProperty({ description: 'Valor promedio de pedido', example: 381.71 })
  averageOrderValue: number;

  @ApiProperty({ description: 'Último pedido realizado', example: '2025-08-25' })
  lastOrderDate: string;
}

export class SellerStatsDto {
  @ApiProperty({ description: 'ID del vendedor' })
  sellerId: string;

  @ApiProperty({ description: 'Nombre del vendedor', example: 'Juan Pérez' })
  sellerName: string;

  @ApiProperty({ description: 'Total de ventas del vendedor', example: 8750.00 })
  totalSales: number;

  @ApiProperty({ description: 'Número de pedidos gestionados', example: 28 })
  totalOrders: number;

  @ApiProperty({ description: 'Número de clientes únicos atendidos', example: 15 })
  uniqueCustomers: number;

  @ApiProperty({ description: 'Ganancia generada', example: 2625.00 })
  totalProfit: number;
}

export class SalesOverTimeDto {
  @ApiProperty({ description: 'Fecha (YYYY-MM-DD)', example: '2025-08-25' })
  date: string;

  @ApiProperty({ description: 'Total de ventas en esta fecha', example: 1250.50 })
  totalSales: number;

  @ApiProperty({ description: 'Número de pedidos en esta fecha', example: 5 })
  orderCount: number;

  @ApiProperty({ description: 'Ganancia en esta fecha', example: 375.15 })
  totalProfit: number;
}

export class StatsResponseDto {
  @ApiProperty({ description: 'Estadísticas generales de ventas' })
  salesStats: SalesStatsDto;

  @ApiProperty({ description: 'Top 10 productos más vendidos', type: [TopProductDto] })
  topProducts: TopProductDto[];

  @ApiProperty({ description: 'Top 10 mejores clientes', type: [TopCustomerDto] })
  topCustomers: TopCustomerDto[];

  @ApiProperty({ description: 'Estadísticas por vendedor', type: [SellerStatsDto] })
  sellerStats: SellerStatsDto[];

  @ApiProperty({ description: 'Ventas a lo largo del tiempo', type: [SalesOverTimeDto] })
  salesOverTime: SalesOverTimeDto[];

  @ApiProperty({ description: 'Período de consulta aplicado' })
  period: {
    startDate: string;
    endDate: string;
  };
}
