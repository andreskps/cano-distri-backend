# 📊 Documentación API - Estadísticas

## Tabla de Contenidos
- [Información General](#información-general)
- [Autenticación](#autenticación)
- [Endpoints Principales](#endpoints-principales)
- [Endpoints Específicos](#endpoints-específicos)
- [Modelos de Datos](#modelos-de-datos)
- [Filtros y Períodos](#filtros-y-períodos)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Casos de Uso](#casos-de-uso)

---

## Información General

La API de **Estadísticas** permite consultar métricas importantes del negocio, incluyendo ventas, productos más vendidos, mejores clientes, rendimiento por vendedor y análisis temporal.

**Base URL:** `http://localhost:3000/api/v1/estadisticas`

### Características Principales:
- 📈 **Estadísticas de ventas** generales y detalladas
- 🏆 **Rankings** de productos y clientes top
- 👥 **Análisis por vendedor** y rendimiento
- 📅 **Filtros por fecha** y períodos predefinidos
- 💰 **Métricas financieras** con costos y ganancias
- 📊 **Datos para gráficos** temporales
- 🔒 **Control de acceso** por roles de usuario

---

## Autenticación

Todos los endpoints requieren autenticación JWT:

```http
Authorization: Bearer <access_token>
```

### Roles de Usuario:
- **SELLER**: Ve solo sus propias estadísticas
- **ADMIN**: Ve estadísticas de todos los vendedores

---

## Endpoints Principales

### 1. Estadísticas Completas
**GET** `/api/v1/estadisticas`

Obtiene todas las estadísticas principales del negocio.

#### Query Parameters
```
?startDate=2025-01-01&endDate=2025-12-31
?period=thisMonth
?sellerId=123e4567-e89b-12d3-a456-426614174000 (solo admin)
?customerId=123e4567-e89b-12d3-a456-426614174001
?status=delivered
```

#### Response - 200 OK
```json
{
  "salesStats": {
    "totalSales": 15420.50,
    "totalCosts": 8950.25,
    "totalProfit": 6470.25,
    "averageProfitMargin": 41.95,
    "totalOrders": 45,
    "deliveredOrders": 38,
    "pendingOrders": 5,
    "cancelledOrders": 2,
    "averageOrderValue": 342.68,
    "totalProductsSold": 1250
  },
  "topProducts": [
    {
      "productId": "prod-001",
      "productName": "Coca Cola 600ml",
      "productCode": "CC-600",
      "totalQuantitySold": 150,
      "totalRevenue": 3750.00,
      "totalProfit": 1125.00
    }
  ],
  "topCustomers": [
    {
      "customerId": "cust-001",
      "customerName": "Supermercado La Esquina",
      "totalOrders": 12,
      "totalSpent": 4580.50,
      "averageOrderValue": 381.71,
      "lastOrderDate": "2025-08-25"
    }
  ],
  "sellerStats": [
    {
      "sellerId": "seller-001",
      "sellerName": "juan.perez@empresa.com",
      "totalSales": 8750.00,
      "totalOrders": 28,
      "uniqueCustomers": 15,
      "totalProfit": 2625.00
    }
  ],
  "salesOverTime": [
    {
      "date": "2025-08-25",
      "totalSales": 1250.50,
      "orderCount": 5,
      "totalProfit": 375.15
    }
  ],
  "period": {
    "startDate": "2025-08-01",
    "endDate": "2025-08-31"
  }
}
```

---

## Endpoints Específicos

### 2. Resumen Rápido
**GET** `/api/v1/estadisticas/resumen`

Retorna solo las métricas principales para dashboard.

#### Response - 200 OK
```json
{
  "salesStats": {
    "totalSales": 15420.50,
    "totalProfit": 6470.25,
    "totalOrders": 45,
    "averageOrderValue": 342.68
  },
  "topProducts": [], // Solo top 5
  "topCustomers": [], // Solo top 5
  "period": {
    "startDate": "2025-08-01",
    "endDate": "2025-08-31"
  }
}
```

---

### 3. Estadísticas por Vendedor
**GET** `/api/v1/estadisticas/vendedores`

Retorna rendimiento detallado por vendedor.

#### Response - 200 OK
```json
{
  "sellerStats": [
    {
      "sellerId": "seller-001",
      "sellerName": "juan.perez@empresa.com",
      "totalSales": 8750.00,
      "totalOrders": 28,
      "uniqueCustomers": 15,
      "totalProfit": 2625.00
    }
  ],
  "period": {
    "startDate": "2025-08-01",
    "endDate": "2025-08-31"
  }
}
```

---

### 4. Estadísticas de Productos
**GET** `/api/v1/estadisticas/productos`

Retorna productos más vendidos y rentables.

#### Response - 200 OK
```json
{
  "topProducts": [
    {
      "productId": "prod-001",
      "productName": "Coca Cola 600ml",
      "productCode": "CC-600",
      "totalQuantitySold": 150,
      "totalRevenue": 3750.00,
      "totalProfit": 1125.00
    }
  ],
  "period": {
    "startDate": "2025-08-01",
    "endDate": "2025-08-31"
  }
}
```

---

### 5. Estadísticas de Clientes
**GET** `/api/v1/estadisticas/clientes`

Retorna mejores clientes y patrones de compra.

#### Response - 200 OK
```json
{
  "topCustomers": [
    {
      "customerId": "cust-001",
      "customerName": "Supermercado La Esquina",
      "totalOrders": 12,
      "totalSpent": 4580.50,
      "averageOrderValue": 381.71,
      "lastOrderDate": "2025-08-25"
    }
  ],
  "period": {
    "startDate": "2025-08-01",
    "endDate": "2025-08-31"
  }
}
```

---

### 6. Estadísticas Temporales
**GET** `/api/v1/estadisticas/tiempo`

Retorna evolución de ventas por día para gráficos.

#### Response - 200 OK
```json
{
  "salesOverTime": [
    {
      "date": "2025-08-25",
      "totalSales": 1250.50,
      "orderCount": 5,
      "totalProfit": 375.15
    },
    {
      "date": "2025-08-26",
      "totalSales": 890.75,
      "orderCount": 3,
      "totalProfit": 267.23
    }
  ],
  "period": {
    "startDate": "2025-08-01",
    "endDate": "2025-08-31"
  }
}
```

---

## Modelos de Datos

### SalesStatsDto
```typescript
{
  totalSales: number;           // Total de ventas entregadas
  totalCosts: number;           // Total de costos
  totalProfit: number;          // Ganancia total
  averageProfitMargin: number;  // Margen promedio (%)
  totalOrders: number;          // Total de pedidos
  deliveredOrders: number;      // Pedidos entregados
  pendingOrders: number;        // Pedidos pendientes
  cancelledOrders: number;      // Pedidos cancelados
  averageOrderValue: number;    // Valor promedio de pedido
  totalProductsSold: number;    // Total unidades vendidas
}
```

### TopProductDto
```typescript
{
  productId: string;            // ID del producto
  productName: string;          // Nombre del producto
  productCode: string;          // Código del producto
  totalQuantitySold: number;    // Unidades vendidas
  totalRevenue: number;         // Ingresos totales
  totalProfit: number;          // Ganancia total
}
```

### TopCustomerDto
```typescript
{
  customerId: string;           // ID del cliente
  customerName: string;         // Nombre del cliente
  totalOrders: number;          // Total de pedidos
  totalSpent: number;           // Total gastado
  averageOrderValue: number;    // Valor promedio de pedido
  lastOrderDate: string;        // Último pedido (YYYY-MM-DD)
}
```

---

## Filtros y Períodos

### Filtros por Fecha
```
?startDate=2025-01-01&endDate=2025-12-31
```

### Períodos Predefinidos
- `last7days` - Últimos 7 días
- `last30days` - Últimos 30 días
- `thisMonth` - Este mes
- `lastMonth` - Mes pasado
- `thisYear` - Este año
- `lastYear` - Año pasado

Ejemplo:
```
?period=thisMonth
```

### Filtros Adicionales
```
?sellerId=123e4567-e89b-12d3-a456-426614174000  # Solo admin
?customerId=123e4567-e89b-12d3-a456-426614174001
?status=delivered  # pending, delivered, cancelled
```

---

## Ejemplos de Uso

### Ejemplo 1: Dashboard Principal
```bash
curl -X GET "http://localhost:3000/api/v1/estadisticas/resumen?period=thisMonth" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Ejemplo 2: Análisis Temporal
```bash
curl -X GET "http://localhost:3000/api/v1/estadisticas/tiempo?startDate=2025-08-01&endDate=2025-08-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Ejemplo 3: Rendimiento de Vendedores (Admin)
```bash
curl -X GET "http://localhost:3000/api/v1/estadisticas/vendedores?period=thisYear" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Ejemplo 4: Análisis de Cliente Específico
```bash
curl -X GET "http://localhost:3000/api/v1/estadisticas?customerId=123e4567-e89b-12d3-a456-426614174001&period=last30days" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## Casos de Uso

### 📊 Dashboard Principal
- **Endpoint**: `/estadisticas/resumen?period=thisMonth`
- **Propósito**: Mostrar métricas clave del mes actual
- **Datos**: Ventas totales, órdenes, top 5 productos/clientes

### 📈 Análisis de Tendencias
- **Endpoint**: `/estadisticas/tiempo?period=last30days`
- **Propósito**: Gráficos de evolución diaria
- **Datos**: Ventas por día, número de órdenes, ganancias

### 🏆 Ranking de Productos
- **Endpoint**: `/estadisticas/productos?period=thisYear`
- **Propósito**: Identificar productos estrella
- **Datos**: Más vendidos, más rentables, tendencias

### 👥 Análisis de Clientes
- **Endpoint**: `/estadisticas/clientes?period=thisYear`
- **Propósito**: Identificar mejores clientes
- **Datos**: Mayor volumen, frecuencia, valor

### 🎯 Rendimiento de Vendedores
- **Endpoint**: `/estadisticas/vendedores?period=thisMonth`
- **Propósito**: Evaluación de desempeño
- **Datos**: Ventas, clientes únicos, ganancias

### 🔍 Análisis Personalizado
- **Endpoint**: `/estadisticas?startDate=2025-01-01&endDate=2025-12-31&status=delivered`
- **Propósito**: Consultas específicas con múltiples filtros
- **Datos**: Todas las métricas con filtros aplicados

---

## Códigos de Error

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Período no válido",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Token inválido",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "No tienes permisos para ver estadísticas de otros vendedores",
  "error": "Forbidden"
}
```

---

## Notas de Implementación

### Rendimiento
- Las consultas utilizan agregaciones SQL nativas para mejor performance
- Se recomiendan índices en `orders.created_at`, `orders.user_id`, `orders.status`
- Los resultados son calculados en tiempo real (sin cache)

### Seguridad
- Los vendedores solo ven sus propias estadísticas
- Los admins pueden ver estadísticas de cualquier vendedor
- Validación de rangos de fecha y parámetros

### Consideraciones
- Las fechas usan el timezone de la base de datos
- Solo se incluyen pedidos con estado 'delivered' en cálculos de ventas
- Los costos y ganancias se calculan desde `order_products`
- Los períodos predefinidos se calculan basados en la fecha actual
