import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderProduct } from '../orders/entities/order-product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { StatsQueryDto } from './dto/stats-query.dto';
import {
  StatsResponseDto,
  SalesStatsDto,
  TopProductDto,
  TopCustomerDto,
  SellerStatsDto,
  SalesOverTimeDto,
} from './dto/stats-response.dto';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderProduct)
    private readonly orderProductRepository: Repository<OrderProduct>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getStats(query: StatsQueryDto, user: User): Promise<StatsResponseDto> {
    try {
    
      const { startDate, endDate } = this.getDateRange(query);
   ;

      // Construir filtros base
      const baseWhereClause = this.buildBaseWhereClause(query, user, startDate, endDate);


      const [
        salesStats,
        topProducts,
        topCustomers,
        sellerStats,
        salesOverTime,
      ] = await Promise.all([
        this.getSalesStats(baseWhereClause),
        this.getTopProducts(baseWhereClause),
        this.getTopCustomers(baseWhereClause),
        this.getSellerStats(baseWhereClause, user),
        this.getSalesOverTime(baseWhereClause),
      ]);


      return {
        salesStats,
        topProducts,
        topCustomers,
        sellerStats,
        salesOverTime,
        period: {
          startDate,
          endDate,
        },
      };
    } catch (error) {
      this.logger.error(`Error al obtener estadísticas: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error interno al obtener estadísticas: ${error.message}`
      );
    }
  }

  private getDateRange(query: StatsQueryDto): { startDate: string; endDate: string } {
    try {
      if (query.startDate && query.endDate) {
        // Validar formato de fechas
        const start = new Date(query.startDate);
        const end = new Date(query.endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
        }

        if (start > end) {
          throw new BadRequestException('La fecha de inicio debe ser menor que la fecha de fin');
        }

  
        return {
          startDate: query.startDate,
          endDate: query.endDate,
        };
      }

      if (query.period) {
    
        return this.getPredefinedPeriod(query.period);
      }

  
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };
    } catch (error) {
      this.logger.error(`Error al calcular rango de fechas: ${error.message}`);
      throw error;
    }
  }

  private getPredefinedPeriod(period: string): { startDate: string; endDate: string } {
    try {
      const today = new Date();
      const endDate = new Date(today);
      let startDate = new Date(today);

      switch (period) {
        case 'last7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'last30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'thisMonth':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case 'lastMonth':
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          endDate.setDate(0); // último día del mes anterior
          break;
        case 'thisYear':
          startDate = new Date(today.getFullYear(), 0, 1);
          break;
        case 'lastYear':
          startDate = new Date(today.getFullYear() - 1, 0, 1);
          endDate.setDate(0);
          endDate.setFullYear(today.getFullYear() - 1, 11, 31);
          break;
        default:
          throw new BadRequestException(`Período no válido: ${period}. Períodos válidos: last7days, last30days, thisMonth, lastMonth, thisYear, lastYear`);
      }

      const result = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };

      return result;
    } catch (error) {
      this.logger.error(`Error al calcular período predefinido: ${error.message}`);
      throw error;
    }
  }

  private buildBaseWhereClause(
    query: StatsQueryDto,
    user: User,
    startDate: string,
    endDate: string,
  ): string {
    try {
      const conditions: string[] = [];

      // Filtro por fechas
      conditions.push(`o."createdAt" >= '${startDate}'`);
      conditions.push(`o."createdAt" <= '${endDate} 23:59:59'`);

      // Excluir pedidos cancelados de todas las estadísticas
      conditions.push(`o.status != 'cancelled'`);

      // Si no es admin, solo ver sus propios pedidos
      if (user.role !== UserRole.ADMIN && query.sellerId) {

        conditions.push(`o."userId" = '${query.sellerId}'`);
      } else if (user.role !== UserRole.ADMIN) {
        conditions.push(`o."userId" = '${user.id}'`);
      }

      // Filtros opcionales
      if (query.customerId) {
        conditions.push(`o."customerId" = '${query.customerId}'`);
      }

      if (query.status) {
        conditions.push(`o.status = '${query.status}'`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      
      return whereClause;
    } catch (error) {
      this.logger.error(`Error al construir cláusula WHERE: ${error.message}`);
      throw new InternalServerErrorException(`Error al construir filtros de consulta: ${error.message}`);
    }
  }

  private async getSalesStats(whereClause: string): Promise<SalesStatsDto> {
    try {
      const query = `
        SELECT 
          COUNT(o.id) as total_orders,
          SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
          SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
          0 as cancelled_orders,
          COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total::numeric ELSE 0 END), 0) as total_sales,
          COALESCE(AVG(CASE WHEN o.status = 'delivered' THEN o.total::numeric ELSE NULL END), 0) as average_order_value
        FROM orders o
        ${whereClause}
      `;


      const salesResult = await this.orderRepository.query(query);
      
      if (!salesResult || salesResult.length === 0) {
       
        salesResult.push({
          total_orders: 0,
          delivered_orders: 0,
          pending_orders: 0,
          cancelled_orders: 0,
          total_sales: 0,
          average_order_value: 0
        });
      }

      const sales = salesResult[0];


      // Consultar costos y ganancias desde order_products
      const costsQuery = `
        SELECT 
          COALESCE(SUM(op."costPrice"::numeric * op.quantity), 0) as total_costs,
          COALESCE(SUM(op.profit::numeric), 0) as total_profit,
          COALESCE(SUM(op.quantity), 0) as total_products_sold
        FROM order_products op
        INNER JOIN orders o ON op."orderId" = o.id
        ${whereClause.replace('WHERE', 'WHERE o.status = \'delivered\' AND')}
      `;


      const costsResult = await this.orderRepository.query(costsQuery);
      
      if (!costsResult || costsResult.length === 0) {
        costsResult.push({
          total_costs: 0,
          total_profit: 0,
          total_products_sold: 0
        });
      }

      const costs = costsResult[0];

      const totalSales = parseFloat(sales.total_sales) || 0;
      const totalCosts = parseFloat(costs.total_costs) || 0;
      const averageProfitMargin = totalSales > 0 ? ((totalSales - totalCosts) / totalSales) * 100 : 0;

      const result = {
        totalSales,
        totalCosts,
        totalProfit: parseFloat(costs.total_profit) || 0,
        averageProfitMargin: Math.round(averageProfitMargin * 100) / 100,
        totalOrders: parseInt(sales.total_orders) || 0,
        deliveredOrders: parseInt(sales.delivered_orders) || 0,
        pendingOrders: parseInt(sales.pending_orders) || 0,
        cancelledOrders: 0, // Siempre 0 ya que excluimos cancelados
        averageOrderValue: Math.round((parseFloat(sales.average_order_value) || 0) * 100) / 100,
        totalProductsSold: parseInt(costs.total_products_sold) || 0,
      };

      return result;

    } catch (error) {
      this.logger.error(`Error al obtener estadísticas de ventas: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Error al calcular estadísticas de ventas: ${error.message}`);
    }
  }

  private async getTopProducts(whereClause: string): Promise<TopProductDto[]> {
    try {
      const query = `
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.code as product_code,
          SUM(op.quantity) as total_quantity_sold,
          SUM(op.subtotal::numeric) as total_revenue,
          COALESCE(SUM(op.profit::numeric), 0) as total_profit
        FROM order_products op
        INNER JOIN orders o ON op."orderId" = o.id
        INNER JOIN products p ON op."productId" = p.id
        ${whereClause.replace('WHERE', 'WHERE o.status = \'delivered\' AND')}
        GROUP BY p.id, p.name, p.code
        ORDER BY total_quantity_sold DESC
        LIMIT 10
      `;

      const result = await this.orderRepository.query(query);

      const topProducts = result.map((row: any) => ({
        productId: row.product_id,
        productName: row.product_name,
        productCode: row.product_code,
        totalQuantitySold: parseInt(row.total_quantity_sold) || 0,
        totalRevenue: Math.round((parseFloat(row.total_revenue) || 0) * 100) / 100,
        totalProfit: Math.round((parseFloat(row.total_profit) || 0) * 100) / 100,
      }));

      return topProducts;

    } catch (error) {
      this.logger.error(`Error al obtener top productos: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Error al obtener productos más vendidos: ${error.message}`);
    }
  }

  private async getTopCustomers(whereClause: string): Promise<TopCustomerDto[]> {
    try {
      const query = `
        SELECT 
          c.id as customer_id,
          c.name as customer_name,
          COUNT(o.id) as total_orders,
          SUM(o.total::numeric) as total_spent,
          AVG(o.total::numeric) as average_order_value,
          MAX(o."createdAt") as last_order_date
        FROM orders o
        INNER JOIN customers c ON o."customerId" = c.id
        ${whereClause.replace('WHERE', 'WHERE o.status = \'delivered\' AND')}
        GROUP BY c.id, c.name
        ORDER BY total_spent DESC
        LIMIT 10
      `;

      const result = await this.orderRepository.query(query);

      const topCustomers = result.map((row: any) => ({
        customerId: row.customer_id,
        customerName: row.customer_name,
        totalOrders: parseInt(row.total_orders) || 0,
        totalSpent: Math.round((parseFloat(row.total_spent) || 0) * 100) / 100,
        averageOrderValue: Math.round((parseFloat(row.average_order_value) || 0) * 100) / 100,
        lastOrderDate: new Date(row.last_order_date).toISOString().split('T')[0],
      }));

      return topCustomers;

    } catch (error) {
      this.logger.error(`Error al obtener top clientes: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Error al obtener mejores clientes: ${error.message}`);
    }
  }

  private async getSellerStats(whereClause: string, user: User): Promise<SellerStatsDto[]> {
    try {
      // Si no es admin, solo retornar sus propias estadísticas
      let userFilter = '';
      if (user.role !== UserRole.ADMIN) {
  userFilter = `AND u.id = '${user.id}'`;
      }

      const query = `
        SELECT 
          u.id as seller_id,
          u.email as seller_name,
          COUNT(o.id) as total_orders,
          COUNT(DISTINCT o."customerId") as unique_customers,
          COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total::numeric ELSE 0 END), 0) as total_sales,
          COALESCE(SUM(op.profit::numeric), 0) as total_profit
        FROM users u
        LEFT JOIN orders o ON u.id = o."userId" ${whereClause.replace('WHERE', 'AND')}
        LEFT JOIN order_products op ON o.id = op."orderId" AND o.status = 'delivered'
        WHERE u.role = 'seller' ${userFilter}
        GROUP BY u.id, u.email
        ORDER BY total_sales DESC
      `;

      const result = await this.orderRepository.query(query);

      const sellerStats = result.map((row: any) => ({
        sellerId: row.seller_id,
        sellerName: row.seller_name || 'Sin nombre',
        totalSales: Math.round((parseFloat(row.total_sales) || 0) * 100) / 100,
        totalOrders: parseInt(row.total_orders) || 0,
        uniqueCustomers: parseInt(row.unique_customers) || 0,
        totalProfit: Math.round((parseFloat(row.total_profit) || 0) * 100) / 100,
      }));

      return sellerStats;

    } catch (error) {
      this.logger.error(`Error al obtener estadísticas de vendedores: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Error al obtener estadísticas de vendedores: ${error.message}`);
    }
  }

  private async getSalesOverTime(whereClause: string): Promise<SalesOverTimeDto[]> {
    try {
      const query = `
        SELECT 
          DATE(o."createdAt") as date,
          COUNT(o.id) as order_count,
          COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total::numeric ELSE 0 END), 0) as total_sales,
          COALESCE(SUM(op.profit::numeric), 0) as total_profit
        FROM orders o
        LEFT JOIN order_products op ON o.id = op."orderId" AND o.status = 'delivered'
        ${whereClause}
        GROUP BY DATE(o."createdAt")
        ORDER BY date ASC
      `;

      const result = await this.orderRepository.query(query);

      const salesOverTime = result.map((row: any) => ({
        date: new Date(row.date).toISOString().split('T')[0],
        totalSales: Math.round((parseFloat(row.total_sales) || 0) * 100) / 100,
        orderCount: parseInt(row.order_count) || 0,
        totalProfit: Math.round((parseFloat(row.total_profit) || 0) * 100) / 100,
      }));

      return salesOverTime;

    } catch (error) {
      this.logger.error(`Error al obtener ventas temporales: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Error al obtener evolución de ventas: ${error.message}`);
    }
  }
}
