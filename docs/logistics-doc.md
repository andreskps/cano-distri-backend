# 🚚 Documentación API - Logística y Cargue

## Información General

El endpoint de **Logística y Cargue** permite consultar y consolidar información de pedidos por fecha de entrega, facilitando la planificación logística y preparación de cargue.

**Base URL:** `http://localhost:3000/api/v1/pedidos/logistica`

---

## Endpoint Principal

### Obtener Logística por Fecha
**GET** `/api/v1/pedidos/logistica`

Consolida todos los productos y cantidades requeridas para una fecha específica de entrega.

#### Query Parameters
- `deliveryDate` (requerido): Fecha de entrega en formato YYYY-MM-DD
- `status` (opcional): Filtrar por estado específico (`pending`, `delivered`, `cancelled`)

#### Headers
```http
Authorization: Bearer <access_token>
```

#### Ejemplo de Request
```bash
GET /api/v1/pedidos/logistica?deliveryDate=2025-09-06&status=pending
```

#### Response - 200 OK
```json
{
  "deliveryDate": "2025-09-06",
  "consolidatedProducts": [
    {
      "productId": "123e4567-e89b-12d3-a456-426614174000",
      "productName": "Coca Cola 600ml",
      "productCode": "CC-600",
      "totalQuantity": 150,
      "orderCount": 8,
      "averagePrice": 25.50,
      "totalValue": 3825.00,
      "unit": "unidad"
    },
    {
      "productId": "123e4567-e89b-12d3-a456-426614174001",
      "productName": "Fanta Naranja 500ml",
      "productCode": "FN-500",
      "totalQuantity": 85,
      "orderCount": 5,
      "averagePrice": 22.00,
      "totalValue": 1870.00,
      "unit": "unidad"
    }
  ],
  "orders": [
    {
      "orderId": "ord-123",
      "orderCode": "ORD-2025-001",
      "customerName": "Supermercado La Esquina",
      "deliveryAddress": "Calle 123 #45-67, Bogotá",
      "orderTotal": 450.75,
      "status": "pending",
      "notes": "Entrega en horario de mañana",
      "products": [
        {
          "productId": "123e4567-e89b-12d3-a456-426614174000",
          "productName": "Coca Cola 600ml",
          "productCode": "CC-600",
          "quantity": 20,
          "unitPrice": 25.50,
          "subtotal": 510.00
        }
      ]
    }
  ],
  "summary": {
    "totalOrders": 12,
    "totalProducts": 235,
    "totalValue": 5695.00,
    "uniqueProducts": 8
  }
}
```

---

## Modelos de Datos

### LogisticsQueryDto
```typescript
{
  deliveryDate: string;    // YYYY-MM-DD (requerido)
  status?: string;         // Estado opcional para filtrar
}
```

### ProductLogisticsDto
```typescript
{
  productId: string;       // ID del producto
  productName: string;     // Nombre del producto
  productCode: string;     // Código del producto
  totalQuantity: number;   // Total de unidades requeridas
  orderCount: number;      // Número de órdenes que incluyen este producto
  averagePrice: number;    // Precio unitario promedio
  totalValue: number;      // Valor total de este producto
  unit?: string;          // Unidad de medida
}
```

### OrderLogisticsDto
```typescript
{
  orderId: string;         // ID de la orden
  orderCode: string;       // Código de la orden
  customerName: string;    // Nombre del cliente
  deliveryAddress?: string; // Dirección de entrega
  orderTotal: number;      // Total de la orden
  status: string;          // Estado de la orden
  notes?: string;         // Notas de la orden
  products: Array<{       // Productos en esta orden
    productId: string;
    productName: string;
    productCode: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}
```

### LogisticsResponseDto
```typescript
{
  deliveryDate: string;              // Fecha consultada
  consolidatedProducts: ProductLogisticsDto[]; // Productos consolidados
  orders: OrderLogisticsDto[];       // Detalle de órdenes
  summary: {                         // Resumen general
    totalOrders: number;
    totalProducts: number;
    totalValue: number;
    uniqueProducts: number;
  };
}
```

---

## Casos de Uso

### 📦 Preparación de Cargue
**Propósito**: Conocer exactamente qué productos y cantidades se necesitan para una fecha específica.

**Ejemplo**:
```bash
curl -X GET "http://localhost:3000/api/v1/pedidos/logistica?deliveryDate=2025-09-06" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Beneficios**:
- Lista consolidada de productos por cantidad
- Evita duplicar esfuerzos de preparación
- Optimiza el espacio de carga

### 🚛 Planificación de Rutas
**Propósito**: Ver todas las órdenes de una fecha específica con direcciones.

**Ejemplo**:
```bash
curl -X GET "http://localhost:3000/api/v1/pedidos/logistica?deliveryDate=2025-09-06&status=pending" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Beneficios**:
- Lista de direcciones de entrega
- Detalles de cada orden
- Notas especiales por cliente

### 📊 Control de Inventario
**Propósito**: Verificar disponibilidad antes de confirmar entregas.

**Información útil**:
- Productos más demandados
- Cantidades totales requeridas
- Valor total del cargue

### 👥 Gestión por Vendedor
**Propósito**: Cada vendedor ve solo sus órdenes asignadas para la fecha.

**Comportamiento**:
- Vendedores: Solo ven sus propias órdenes
- Administradores: Ven todas las órdenes del día

---

## Filtros y Opciones

### Por Estado
```bash
# Solo órdenes pendientes
?deliveryDate=2025-09-06&status=pending

# Solo órdenes entregadas
?deliveryDate=2025-09-06&status=delivered

# Solo órdenes canceladas
?deliveryDate=2025-09-06&status=cancelled
```

### Por Fecha
```bash
# Fecha específica
?deliveryDate=2025-09-06

# Otro ejemplo
?deliveryDate=2025-12-25
```

---

## Características del Endpoint

### ✅ Consolidación Inteligente
- Suma automática de cantidades por producto
- Cálculo de precios promedio
- Ordenamiento por cantidad (mayor a menor)

### ✅ Información Completa
- Detalles de cada orden individual
- Direcciones de entrega
- Notas especiales
- Totales y subtotales

### ✅ Control de Acceso
- Vendedores: Solo sus órdenes asignadas
- Administradores: Todas las órdenes

### ✅ Flexibilidad
- Filtrado por estado de orden
- Información detallada y consolidada
- Formato JSON fácil de procesar

---

## Ejemplos Prácticos

### Ejemplo 1: Cargue del Día
```bash
curl -X GET "http://localhost:3000/api/v1/pedidos/logistica?deliveryDate=2025-09-06" \
  -H "Authorization: Bearer TOKEN"
```

**Respuesta esperada**: Lista completa de productos consolidados y órdenes para preparar el cargue del día.

### Ejemplo 2: Solo Pendientes
```bash
curl -X GET "http://localhost:3000/api/v1/pedidos/logistica?deliveryDate=2025-09-06&status=pending" \
  -H "Authorization: Bearer TOKEN"
```

**Respuesta esperada**: Solo órdenes que aún no han sido entregadas, útil para planificar la ruta del día.

### Ejemplo 3: Verificación Post-Entrega
```bash
curl -X GET "http://localhost:3000/api/v1/pedidos/logistica?deliveryDate=2025-09-05&status=delivered" \
  -H "Authorization: Bearer TOKEN"
```

**Respuesta esperada**: Órdenes ya entregadas del día anterior, útil para reportes y verificación.

---

## Códigos de Error

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Formato de fecha inválido. Use YYYY-MM-DD",
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
  "message": "No tienes permisos para ver estas órdenes",
  "error": "Forbidden"
}
```

---

## Integración Recomendada

### Frontend Dashboard
```typescript
// Obtener logística del día
const logistics = await api.get('/pedidos/logistica', {
  params: { 
    deliveryDate: '2025-09-06',
    status: 'pending'
  }
});

// Mostrar productos consolidados
logistics.consolidatedProducts.forEach(product => {
  console.log(`${product.productName}: ${product.totalQuantity} unidades`);
});
```

### Reportes Excel
El formato JSON es ideal para exportar a Excel:
- Una hoja con productos consolidados
- Otra hoja con detalle de órdenes
- Resumen en la primera fila

### Aplicación Móvil
Perfecta para aplicaciones de logística móvil:
- Lista de productos para preparar
- Checklist de órdenes por entregar
- Navegación a direcciones de clientes
