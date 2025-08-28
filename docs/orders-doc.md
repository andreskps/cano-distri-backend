# 📦 Documentación API - Orders (Pedidos)

## Tabla de Contenidos
- [Información General](#información-general)
- [Autenticación](#autenticación)
- [Estados de Pedidos](#estados-de-pedidos)
- [Endpoints Principales](#endpoints-principales)
- [Gestión de Productos](#gestión-de-productos)
- [Gestión de Estados](#gestión-de-estados)
- [Modelos de Datos](#modelos-de-datos)
- [Códigos de Error](#códigos-de-error)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Flujos de Trabajo](#flujos-de-trabajo)

---

## Información General

La API de **Orders** (Pedidos) permite gestionar todo el ciclo de vida de los pedidos de venta, desde la creación hasta la entrega. Incluye gestión de productos, estados, y seguimiento completo.

**Base URL:** `http://localhost:3000/api/v1/pedidos`

### Características Principales:
- 📝 **Creación de pedidos** con múltiples productos
- 📊 **Seguimiento de estados** en tiempo real
- 💰 **Cálculo automático** de totales y subtotales
- 🏷️ **Códigos únicos** autogenerados
- 📅 **Programación de entregas**
- 🔍 **Búsqueda y filtrado** avanzado
- 👥 **Control de acceso** por vendedores

---

## Autenticación

Todos los endpoints requieren autenticación JWT. Incluir el token en el header:

```http
Authorization: Bearer <access_token>
```

### Roles de Usuario:
- **SELLER**: Puede gestionar solo sus propios pedidos
- **ADMIN**: Puede gestionar todos los pedidos del sistema

---

## Estados de Pedidos

Los pedidos siguen un flujo de estados bien definido:

| Estado | Código | Descripción |
|--------|--------|-------------|
| 🟡 **Pendiente** | `pending` | Pedido creado, esperando confirmación |
| ✅ **Entregado** | `delivered` | Pedido entregado exitosamente |
| ❌ **Cancelado** | `cancelled` | Pedido cancelado |

### Flujo Normal:
```
pending → delivered
```

### Cancelación:
```
Cualquier estado → cancelled (solo antes de 'delivered')
```

---

## Endpoints Principales

### 1. Crear Pedido
**POST** `/api/v1/pedidos`

Crea un nuevo pedido con múltiples productos.

#### Headers
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

#### Request Body
```json
{
  "customerId": "550e8400-e29b-41d4-a716-446655440000",
  "deliveryDate": "2025-08-30",
  "notes": "Entrega en horario de mañana, preguntar por el encargado",
  "products": [
    {
      "productId": "660e8400-e29b-41d4-a716-446655440001",
      "quantity": 10,
      "unitPrice": 25.50
    },
    {
      "productId": "770e8400-e29b-41d4-a716-446655440002",
      "quantity": 5
    }
  ]
}
```

#### Validaciones
- `customerId`: UUID válido del cliente
- `deliveryDate`: Fecha en formato YYYY-MM-DD
- `notes`: Opcional, texto libre
- `products`: Array con al menos 1 producto
  - `productId`: UUID válido del producto
  - `quantity`: Número positivo mínimo 1
  - `unitPrice`: Opcional, precio personalizado

#### Response - 201 Created
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440003",
  "code": "PEDIDO-2025-001",
  "deliveryDate": "2025-08-30",
  "notes": "Entrega en horario de mañana, preguntar por el encargado",
  "total": "382.50",
  "status": "pending",
  "isPaid": false,
  "createdAt": "2025-08-28T10:30:00.000Z",
  "customer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Comercial ABC S.A.",
    "email": "cliente@abc.com"
  },
  "user": {
    "id": "880e8400-e29b-41d4-a716-446655440004",
    "name": "Juan Pérez",
    "email": "juan@empresa.com"
  },
  "orderProducts": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "quantity": 10,
      "unitPrice": "25.50",
      "subtotal": "255.00",
      "product": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Coca Cola 600ml",
        "code": "CC-600"
      }
    },
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440006",
      "quantity": 5,
      "unitPrice": "25.50",
      "subtotal": "127.50",
      "product": {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "Pepsi 500ml",
        "code": "PS-500"
      }
    }
  ],
  "statusHistory": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440007",
      "status": "pending",
      "notes": "Pedido creado",
      "createdAt": "2025-08-28T10:30:00.000Z",
      "user": {
        "name": "Juan Pérez"
      }
    }
  ]
}
```

---

### 2. Listar Pedidos con Filtros
**GET** `/api/v1/pedidos`

Obtiene una lista paginada de pedidos con múltiples filtros.

#### Query Parameters
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `page` | number | No | 1 | Número de página |
| `limit` | number | No | 10 | Elementos por página (1-100) |
| `fecha` | string | No | - | Filtrar por fecha de entrega (YYYY-MM-DD) |
| `estado` | string | No | - | Filtrar por estado del pedido |
| `clienteId` | string | No | - | Filtrar por cliente específico |
| `codigo` | string | No | - | Buscar por código de pedido |

#### Estados Válidos para Filtro:
- `pending` - Pendientes
- `confirmed` - Confirmados
- `in_preparation` - En preparación
- `ready_for_delivery` - Listos para entrega
- `in_delivery` - En entrega
- `delivered` - Entregados
- `cancelled` - Cancelados

#### Ejemplos de Uso
```http
# Pedidos pendientes
GET /api/v1/pedidos?estado=pending

# Pedidos de un cliente específico
GET /api/v1/pedidos?clienteId=550e8400-e29b-41d4-a716-446655440000

# Entregas programadas para hoy
GET /api/v1/pedidos?fecha=2025-08-28

# Buscar por código
GET /api/v1/pedidos?codigo=PEDIDO-2025-001

# Filtros combinados
GET /api/v1/pedidos?estado=confirmed&fecha=2025-08-30&page=2&limit=5
```

#### Response - 200 OK
```json
{
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440003",
      "code": "PEDIDO-2025-001",
      "deliveryDate": "2025-08-30",
      "total": "382.50",
      "status": "pending",
      "isPaid": false,
      "createdAt": "2025-08-28T10:30:00.000Z",
      "customer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Comercial ABC S.A."
      },
      "orderProducts": [
        {
          "quantity": 10,
          "unitPrice": "25.50",
          "subtotal": "255.00",
          "product": {
            "name": "Coca Cola 600ml",
            "code": "CC-600"
          }
        }
      ]
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 3. Obtener Pedido por ID
**GET** `/api/v1/pedidos/:id`

Obtiene los detalles completos de un pedido específico.

#### Path Parameters
- `id` (UUID): ID del pedido

#### Response - 200 OK
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440003",
  "code": "PEDIDO-2025-001",
  "deliveryDate": "2025-08-30",
  "notes": "Entrega en horario de mañana",
  "total": "382.50",
  "status": "confirmed",
  "isPaid": false,
  "createdAt": "2025-08-28T10:30:00.000Z",
  "customer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Comercial ABC S.A.",
    "email": "cliente@abc.com",
    "phone": "+502 1234-5678"
  },
  "address": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "address": "5ta Avenida 10-20, Zona 10",
    "city": "Guatemala"
  },
  "user": {
    "id": "880e8400-e29b-41d4-a716-446655440004",
    "name": "Juan Pérez",
    "email": "juan@empresa.com"
  },
  "orderProducts": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "quantity": 10,
      "unitPrice": "25.50",
      "subtotal": "255.00",
      "product": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Coca Cola 600ml",
        "code": "CC-600",
        "price": "25.50"
      }
    }
  ],
  "statusHistory": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440007",
      "status": "pending",
      "notes": "Pedido creado",
      "createdAt": "2025-08-28T10:30:00.000Z",
      "user": {
        "name": "Juan Pérez"
      }
    },
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440008",
      "status": "confirmed",
      "notes": "Pedido confirmado por el vendedor",
      "createdAt": "2025-08-28T11:00:00.000Z",
      "user": {
        "name": "Juan Pérez"
      }
    }
  ]
}
```

---

### 4. Actualizar Pedido
**PUT** `/api/v1/pedidos/:id`

Actualiza los datos de un pedido existente.

#### Path Parameters
- `id` (UUID): ID del pedido

#### Request Body
```json
{
  "deliveryDate": "2025-08-31",
  "notes": "Cambio de fecha de entrega solicitado por el cliente",
  "products": [
    {
      "productId": "660e8400-e29b-41d4-a716-446655440001",
      "quantity": 15,
      "unitPrice": 24.00
    }
  ]
}
```

#### Response - 200 OK
*(Misma estructura que la respuesta de creación con los datos actualizados)*

#### Restricciones
- Solo se pueden actualizar pedidos en estado `pending` o `confirmed`
- No se puede modificar el cliente una vez creado el pedido
- Los cambios recalculan automáticamente los totales

---

### 5. Eliminar Pedido
**DELETE** `/api/v1/pedidos/:id`

Elimina un pedido del sistema.

#### Path Parameters
- `id` (UUID): ID del pedido

#### Response - 204 No Content
*(Sin contenido en el cuerpo de la respuesta)*

#### Restricciones
- Solo se pueden eliminar pedidos en estado `pending`
- Los administradores pueden eliminar pedidos en cualquier estado
- La eliminación es permanente

---

## Gestión de Productos

### 1. Añadir Producto al Pedido
**POST** `/api/v1/pedidos/:orderId/productos`

Añade un nuevo producto a un pedido existente.

#### Path Parameters
- `orderId` (UUID): ID del pedido

#### Request Body
```json
{
  "productId": "880e8400-e29b-41d4-a716-446655440009",
  "quantity": 3,
  "unitPrice": 15.75
}
```

#### Response - 201 Created
```json
{
  "id": "ee0e8400-e29b-41d4-a716-446655440010",
  "quantity": 3,
  "unitPrice": "15.75",
  "subtotal": "47.25",
  "product": {
    "id": "880e8400-e29b-41d4-a716-446655440009",
    "name": "Fanta Naranja 500ml",
    "code": "FN-500"
  }
}
```

---

### 2. Actualizar Producto del Pedido
**PUT** `/api/v1/pedidos/:orderId/productos/:productId`

Actualiza la cantidad o precio de un producto en el pedido.

#### Path Parameters
- `orderId` (UUID): ID del pedido
- `productId` (UUID): ID del producto en el pedido

#### Request Body
```json
{
  "quantity": 8,
  "unitPrice": 24.50
}
```

#### Response - 200 OK
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440005",
  "quantity": 8,
  "unitPrice": "24.50",
  "subtotal": "196.00",
  "product": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Coca Cola 600ml",
    "code": "CC-600"
  }
}
```

---

### 3. Eliminar Producto del Pedido
**DELETE** `/api/v1/pedidos/:orderId/productos/:productId`

Elimina un producto específico del pedido.

#### Path Parameters
- `orderId` (UUID): ID del pedido
- `productId` (UUID): ID del producto en el pedido

#### Response - 204 No Content

#### Restricciones
- No se puede eliminar el último producto del pedido
- Solo en pedidos con estado `pending` o `confirmed`

---

## Gestión de Estados

### 1. Cambiar Estado del Pedido
**PATCH** `/api/v1/pedidos/:id/estado`

Cambia el estado de un pedido siguiendo el flujo permitido.

#### Path Parameters
- `id` (UUID): ID del pedido

#### Request Body
```json
{
  "status": "confirmed",
  "notes": "Pedido confirmado después de verificar inventario"
}
```

#### Estados Válidos:
- `pending` → `confirmed` o `cancelled`
- `confirmed` → `in_preparation` o `cancelled`
- `in_preparation` → `ready_for_delivery` o `cancelled`
- `ready_for_delivery` → `in_delivery`
- `in_delivery` → `delivered`

#### Response - 200 OK
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440003",
  "status": "confirmed",
  "statusHistory": [
    {
      "id": "ff0e8400-e29b-41d4-a716-446655440011",
      "status": "confirmed",
      "notes": "Pedido confirmado después de verificar inventario",
      "createdAt": "2025-08-28T12:00:00.000Z",
      "user": {
        "name": "Juan Pérez"
      }
    }
  ]
}
```

---

### 2. Historial de Estados
**GET** `/api/v1/pedidos/:id/historial`

Obtiene el historial completo de cambios de estado.

#### Path Parameters
- `id` (UUID): ID del pedido

#### Response - 200 OK
```json
[
  {
    "id": "cc0e8400-e29b-41d4-a716-446655440007",
    "status": "pending",
    "notes": "Pedido creado",
    "createdAt": "2025-08-28T10:30:00.000Z",
    "user": {
      "id": "880e8400-e29b-41d4-a716-446655440004",
      "name": "Juan Pérez"
    }
  },
  {
    "id": "dd0e8400-e29b-41d4-a716-446655440008",
    "status": "confirmed",
    "notes": "Pedido confirmado por el vendedor",
    "createdAt": "2025-08-28T11:00:00.000Z",
    "user": {
      "id": "880e8400-e29b-41d4-a716-446655440004",
      "name": "Juan Pérez"
    }
  }
]
```

---

## Modelos de Datos

### Order
```typescript
{
  id: string;                          // UUID del pedido
  code: string;                        // Código único autogenerado
  deliveryDate: string;                // Fecha de entrega (YYYY-MM-DD)
  notes?: string;                      // Notas adicionales
  total: string;                       // Total del pedido (calculado)
  status: OrderStatus;                 // Estado actual
  isPaid: boolean;                     // Estado de pago
  createdAt: Date;                     // Fecha de creación
  customer: Customer;                  // Cliente del pedido
  address?: CustomerAddress;           // Dirección de entrega
  user?: User;                         // Vendedor que creó el pedido
  orderProducts: OrderProduct[];       // Productos del pedido
  statusHistory: OrderStatusHistory[]; // Historial de estados
}
```

### OrderProduct
```typescript
{
  id: string;          // UUID del producto en el pedido
  quantity: number;    // Cantidad solicitada
  unitPrice: string;   // Precio unitario aplicado
  subtotal: string;    // Subtotal calculado (quantity * unitPrice)
  createdAt: Date;     // Fecha de adición
  order: Order;        // Pedido padre
  product: Product;    // Producto referenciado
}
```

### OrderStatusHistory
```typescript
{
  id: string;          // UUID del registro de historial
  status: OrderStatus; // Estado al que cambió
  notes?: string;      // Notas del cambio
  createdAt: Date;     // Fecha del cambio
  order: Order;        // Pedido padre
  user?: User;         // Usuario que realizó el cambio
}
```

### CreateOrderDto
```typescript
{
  customerId: string;              // UUID del cliente (requerido)
  deliveryDate: string;            // Fecha de entrega YYYY-MM-DD (requerido)
  notes?: string;                  // Notas opcionales
  products: CreateOrderProductDto[]; // Array de productos (mínimo 1)
}
```

### CreateOrderProductDto
```typescript
{
  productId: string;    // UUID del producto (requerido)
  quantity: number;     // Cantidad positiva (requerido, mín: 1)
  unitPrice?: number;   // Precio personalizado (opcional)
}
```

---

## Códigos de Error

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "La cantidad debe ser un número positivo",
    "La fecha de entrega es requerida"
  ],
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Pedido no encontrado",
  "error": "Not Found"
}
```

### 422 Unprocessable Entity
```json
{
  "statusCode": 422,
  "message": "No se puede cambiar de 'delivered' a 'confirmed'",
  "error": "Unprocessable Entity"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "El producto ya existe en este pedido",
  "error": "Conflict"
}
```

---

## Ejemplos de Uso

### Ejemplo 1: Crear Pedido Completo
```bash
curl -X POST http://localhost:3000/api/v1/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "deliveryDate": "2025-08-30",
    "notes": "Cliente solicita entrega temprano",
    "products": [
      {
        "productId": "660e8400-e29b-41d4-a716-446655440001",
        "quantity": 20,
        "unitPrice": 25.00
      },
      {
        "productId": "770e8400-e29b-41d4-a716-446655440002",
        "quantity": 15
      }
    ]
  }'
```

### Ejemplo 2: Flujo de Estados
```bash
# 1. Confirmar pedido
curl -X PATCH http://localhost:3000/api/v1/pedidos/990e8400-e29b-41d4-a716-446655440003/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "confirmed",
    "notes": "Inventario verificado"
  }'

# 2. Pasar a preparación
curl -X PATCH http://localhost:3000/api/v1/pedidos/990e8400-e29b-41d4-a716-446655440003/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "in_preparation",
    "notes": "Iniciando preparación de productos"
  }'

# 3. Marcar listo para entrega
curl -X PATCH http://localhost:3000/api/v1/pedidos/990e8400-e29b-41d4-a716-446655440003/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "ready_for_delivery",
    "notes": "Pedido empacado y listo"
  }'
```

### Ejemplo 3: Gestión de Productos
```bash
# Añadir producto al pedido
curl -X POST http://localhost:3000/api/v1/pedidos/990e8400-e29b-41d4-a716-446655440003/productos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "productId": "880e8400-e29b-41d4-a716-446655440009",
    "quantity": 5,
    "unitPrice": 12.50
  }'

# Actualizar cantidad de producto
curl -X PUT http://localhost:3000/api/v1/pedidos/990e8400-e29b-41d4-a716-446655440003/productos/aa0e8400-e29b-41d4-a716-446655440005 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "quantity": 25
  }'
```

### Ejemplo 4: Filtros y Búsquedas
```bash
# Pedidos pendientes del día
curl -X GET "http://localhost:3000/api/v1/pedidos?estado=pending&fecha=2025-08-28" \
  -H "Authorization: Bearer $TOKEN"

# Pedidos de un cliente específico
curl -X GET "http://localhost:3000/api/v1/pedidos?clienteId=550e8400-e29b-41d4-a716-446655440000&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Buscar por código
curl -X GET "http://localhost:3000/api/v1/pedidos?codigo=PEDIDO-2025-001" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Flujos de Trabajo

### **Flujo Normal de Pedido**
```mermaid
graph TD
    A[Crear Pedido] --> B[Pendiente]
    B --> C[Confirmar]
    C --> D[En Preparación]
    D --> E[Listo para Entrega]
    E --> F[En Entrega]
    F --> G[Entregado]
    
    B --> H[Cancelar]
    C --> H
    D --> H
```

### **Casos de Uso Comunes**

#### **1. Vendedor Crea Pedido**
1. Selecciona cliente y productos
2. Especifica fecha de entrega
3. Crea pedido (estado: `pending`)
4. Confirma pedido (estado: `confirmed`)

#### **2. Almacén Procesa Pedido**
1. Recibe pedido confirmado
2. Inicia preparación (estado: `in_preparation`)
3. Empaca productos (estado: `ready_for_delivery`)

#### **3. Entrega de Pedido**
1. Asigna repartidor (estado: `in_delivery`)
2. Entrega al cliente (estado: `delivered`)

#### **4. Modificación de Pedido**
1. Solo en estados `pending` o `confirmed`
2. Actualiza productos/cantidades
3. Recalcula totales automáticamente

### **Mejores Prácticas**
- ✅ Verificar inventario antes de confirmar
- ✅ Documentar cambios de estado con notas
- ✅ Mantener comunicación con el cliente
- ✅ Actualizar estados en tiempo real
- ❌ No saltar estados en el flujo
- ❌ No modificar pedidos en entrega

---

## Permisos y Seguridad

### Vendedores (SELLER)
- ✅ Pueden crear pedidos para sus clientes
- ✅ Pueden ver solo sus propios pedidos
- ✅ Pueden actualizar pedidos `pending` y `confirmed`
- ✅ Pueden cambiar estados siguiendo el flujo
- ❌ No pueden ver pedidos de otros vendedores
- ❌ No pueden eliminar pedidos `confirmed` o superiores

### Administradores (ADMIN)
- ✅ Pueden gestionar todos los pedidos
- ✅ Pueden forzar cambios de estado
- ✅ Pueden eliminar pedidos en cualquier estado
- ✅ Pueden ver estadísticas globales
- ✅ Pueden asignar pedidos a vendedores

---

## Notas Técnicas

### **Códigos de Pedido**
- Formato: `PEDIDO-YYYY-NNN`
- Autogenerados y únicos
- Secuenciales por año

### **Cálculos Automáticos**
- Subtotales = cantidad × precio unitario
- Total = suma de todos los subtotales
- Recálculo automático en cada cambio

### **Integridad de Datos**
- Validación de productos existentes
- Verificación de clientes activos
- Control de estados válidos
- Auditoría completa de cambios

### **Rendimiento**
- Índices en campos de búsqueda frecuente
- Paginación obligatoria para listados
- Carga lazy de relaciones según necesidad

---

*Documentación generada el 28 de agosto de 2025*
