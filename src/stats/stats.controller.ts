import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { StatsQueryDto } from './dto/stats-query.dto';
import { StatsResponseDto } from './dto/stats-response.dto';

@ApiTags('Estadísticas')
@ApiBearerAuth('access-token')
@Controller('estadisticas')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener estadísticas de ventas y rendimiento',
    description: 'Retorna estadísticas completas incluyendo ventas, productos top, mejores clientes, rendimiento por vendedor y ventas a lo largo del tiempo.'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio (YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin (YYYY-MM-DD)', example: '2025-12-31' })
  @ApiQuery({ name: 'sellerId', required: false, description: 'ID del vendedor (solo admins)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiQuery({ name: 'customerId', required: false, description: 'ID del cliente específico', example: '123e4567-e89b-12d3-a456-426614174001' })
  @ApiQuery({ name: 'status', required: false, description: 'Estado del pedido', enum: ['pending', 'delivered', 'cancelled'] })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    description: 'Período predefinido', 
    enum: ['last7days', 'last30days', 'thisMonth', 'lastMonth', 'thisYear', 'lastYear'],
    example: 'thisMonth'
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    type: StatsResponseDto,
  })
  async getStats(
    @Query() query: StatsQueryDto,
    @GetUser() user: User,
  ): Promise<StatsResponseDto> {
    return this.statsService.getStats(query, user);
  }

  @Get('resumen')
  @ApiOperation({ 
    summary: 'Obtener resumen rápido de estadísticas',
    description: 'Retorna solo las estadísticas principales para dashboard.'
  })
  @ApiQuery({ name: 'period', required: false, description: 'Período', example: 'thisMonth' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de estadísticas obtenido exitosamente',
  })
  async getStatsSummary(
    @Query() query: Pick<StatsQueryDto, 'period' | 'startDate' | 'endDate'>,
    @GetUser() user: User,
  ) {
    const fullStats = await this.statsService.getStats(query, user);
    
    return {
      salesStats: fullStats.salesStats,
      topProducts: fullStats.topProducts.slice(0, 5), // Solo top 5
      topCustomers: fullStats.topCustomers.slice(0, 5), // Solo top 5
      period: fullStats.period,
    };
  }

  @Get('vendedores')
  @ApiOperation({ 
    summary: 'Obtener estadísticas por vendedor',
    description: 'Retorna estadísticas detalladas de rendimiento por vendedor.'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin', example: '2025-12-31' })
  @ApiQuery({ name: 'period', required: false, description: 'Período', example: 'thisMonth' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas por vendedor obtenidas exitosamente',
  })
  async getSellerStats(
    @Query() query: Pick<StatsQueryDto, 'period' | 'startDate' | 'endDate'>,
    @GetUser() user: User,
  ) {
    const fullStats = await this.statsService.getStats(query, user);
    
    return {
      sellerStats: fullStats.sellerStats,
      period: fullStats.period,
    };
  }

  @Get('productos')
  @ApiOperation({ 
    summary: 'Obtener estadísticas de productos',
    description: 'Retorna estadísticas de productos más vendidos y rentables.'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin', example: '2025-12-31' })
  @ApiQuery({ name: 'period', required: false, description: 'Período', example: 'thisMonth' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de productos obtenidas exitosamente',
  })
  async getProductStats(
    @Query() query: Pick<StatsQueryDto, 'period' | 'startDate' | 'endDate'>,
    @GetUser() user: User,
  ) {
    const fullStats = await this.statsService.getStats(query, user);
    
    return {
      topProducts: fullStats.topProducts,
      period: fullStats.period,
    };
  }

  @Get('clientes')
  @ApiOperation({ 
    summary: 'Obtener estadísticas de clientes',
    description: 'Retorna estadísticas de mejores clientes y patrones de compra.'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin', example: '2025-12-31' })
  @ApiQuery({ name: 'period', required: false, description: 'Período', example: 'thisMonth' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de clientes obtenidas exitosamente',
  })
  async getCustomerStats(
    @Query() query: Pick<StatsQueryDto, 'period' | 'startDate' | 'endDate'>,
    @GetUser() user: User,
  ) {
    const fullStats = await this.statsService.getStats(query, user);
    
    return {
      topCustomers: fullStats.topCustomers,
      period: fullStats.period,
    };
  }

  @Get('tiempo')
  @ApiOperation({ 
    summary: 'Obtener estadísticas a lo largo del tiempo',
    description: 'Retorna evolución de ventas por día para gráficos.'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha de inicio', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha de fin', example: '2025-12-31' })
  @ApiQuery({ name: 'period', required: false, description: 'Período', example: 'thisMonth' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas temporales obtenidas exitosamente',
  })
  async getSalesOverTime(
    @Query() query: Pick<StatsQueryDto, 'period' | 'startDate' | 'endDate'>,
    @GetUser() user: User,
  ) {
    const fullStats = await this.statsService.getStats(query, user);
    
    return {
      salesOverTime: fullStats.salesOverTime,
      period: fullStats.period,
    };
  }
}
