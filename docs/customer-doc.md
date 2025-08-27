# 📋 Documentación API - Customers & Addresses

## Tabla de Contenidos
- [Información General](#información-general)
- [Autenticación](#autenticación)
- [Endpoints de Clientes](#endpoints-de-clientes)
- [Endpoints de Direcciones](#endpoints-de-direcciones)
- [Modelos de Datos](#modelos-de-datos)
- [Códigos de Error](#códigos-de-error)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Información General

La API de **Customers** permite gestionar los clientes del sistema de distribución. Los vendedores pueden crear y gestionar sus propios clientes, mientras que los administradores tienen acceso completo a todos los clientes del sistema.

**Base URL:** `http://localhost:3000/api/v1/customers`

---

## Autenticación

Todos los endpoints requieren autenticación JWT. Incluir el token en el header:

```http
Authorization: Bearer <access_token>
```

### Roles de Usuario:
- **SELLER**: Puede ver y gestionar solo sus propios clientes
- **ADMIN**: Puede ver y gestionar todos los clientes del sistema

---

## Endpoints de Clientes

### 1. Crear Cliente
**POST** `/api/v1/customers`

Crea un nuevo cliente y lo asigna al vendedor autenticado.

#### Headers
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

#### Request Body
```json
{
  "name": "Comercial ABC S.A.",
  "taxId": "123456-7",
  "email": "cliente@example.com",
  "phone": "+502 1234-5678",
  "contactPerson": "María López",
  "notes": "Cliente con condiciones especiales de pago"
}
```

#### Response - 201 Created
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Comercial ABC S.A.",
  "taxId": "123456-7",
  "email": "cliente@example.com",
  "phone": "+502 1234-5678",
  "contactPerson": "María López",
  "notes": "Cliente con condiciones especiales de pago",
  "createdAt": "2025-08-27T10:30:00.000Z",
  "seller": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Juan Pérez",
    "email": "juan@empresa.com"
  },
  "addresses": []
}
```

#### Validaciones
- `name`: Requerido, 2-150 caracteres
- `taxId`: Opcional, máximo 100 caracteres
- `email`: Opcional, formato de email válido, máximo 150 caracteres
- `phone`: Opcional, máximo 50 caracteres
- `contactPerson`: Opcional, máximo 150 caracteres
- `notes`: Opcional, texto libre

---

### 2. Listar Clientes con Filtros Avanzados
**GET** `/api/v1/customers`

Obtiene una lista paginada de clientes con capacidades de búsqueda y ordenamiento.

#### Query Parameters
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `page` | number | No | 1 | Número de página |
| `limit` | number | No | 10 | Elementos por página (1-100) |
| `search` | string | No | - | Término de búsqueda |
| `sortBy` | string | No | createdAt | Campo de ordenamiento |
| `sortOrder` | string | No | DESC | Orden: ASC o DESC |

#### Campos de Ordenamiento (`sortBy`)
- `name` - Nombre del cliente
- `email` - Email del cliente
- `phone` - Teléfono del cliente
- `taxId` - NIT/Identificación fiscal
- `contactPerson` - Persona de contacto
- `createdAt` - Fecha de creación

#### Campos de Búsqueda
El parámetro `search` busca en los siguientes campos:
- Nombre del cliente
- Email
- Teléfono
- NIT/Identificación fiscal
- Persona de contacto
- Notas

#### Ejemplos de Uso
```http
# Búsqueda básica
GET /api/v1/customers?search=ABC&page=1&limit=10

# Ordenamiento por nombre
GET /api/v1/customers?sortBy=name&sortOrder=ASC

# Búsqueda con filtros combinados
GET /api/v1/customers?search=maria&sortBy=createdAt&sortOrder=DESC&page=2&limit=5
```

#### Response - 200 OK
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Comercial ABC S.A.",
      "taxId": "123456-7",
      "email": "cliente@example.com",
      "phone": "+502 1234-5678",
      "contactPerson": "María López",
      "notes": "Cliente con condiciones especiales",
      "createdAt": "2025-08-27T10:30:00.000Z",
      "seller": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Juan Pérez",
        "email": "juan@empresa.com"
      },
      "addresses": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440002",
          "street": "5ta Avenida 10-20",
          "city": "Guatemala",
          "state": "Guatemala",
          "postalCode": "01001",
          "country": "Guatemala"
        }
      ]
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 3. Obtener Cliente por ID
**GET** `/api/v1/customers/:id`

Obtiene un cliente específico por su ID.

#### Path Parameters
- `id` (UUID): ID del cliente

#### Response - 200 OK
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Comercial ABC S.A.",
  "taxId": "123456-7",
  "email": "cliente@example.com",
  "phone": "+502 1234-5678",
  "contactPerson": "María López",
  "notes": "Cliente con condiciones especiales",
  "createdAt": "2025-08-27T10:30:00.000Z",
  "seller": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Juan Pérez",
    "email": "juan@empresa.com"
  },
  "addresses": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "street": "5ta Avenida 10-20",
      "city": "Guatemala",
      "state": "Guatemala",
      "postalCode": "01001",
      "country": "Guatemala"
    }
  ]
}
```

#### Errores
- **404 Not Found**: Cliente no encontrado o no pertenece al vendedor

---

### 4. Actualizar Cliente
**PATCH** `/api/v1/customers/:id`

Actualiza los datos de un cliente existente.

#### Path Parameters
- `id` (UUID): ID del cliente

#### Request Body
```json
{
  "name": "Comercial ABC Actualizado S.A.",
  "phone": "+502 9876-5432",
  "contactPerson": "Carlos Mendoza",
  "notes": "Cliente actualizado con nuevas condiciones"
}
```

#### Response - 200 OK
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Comercial ABC Actualizado S.A.",
  "taxId": "123456-7",
  "email": "cliente@example.com",
  "phone": "+502 9876-5432",
  "contactPerson": "Carlos Mendoza",
  "notes": "Cliente actualizado con nuevas condiciones",
  "createdAt": "2025-08-27T10:30:00.000Z",
  "seller": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Juan Pérez",
    "email": "juan@empresa.com"
  },
  "addresses": []
}
```

---

### 5. Eliminar Cliente (Solo Admin)
**DELETE** `/api/v1/customers/:id`

Elimina un cliente del sistema. Solo disponible para administradores.

#### Path Parameters
- `id` (UUID): ID del cliente

#### Headers
```http
Authorization: Bearer <admin_access_token>
```

#### Response - 204 No Content
*(Sin contenido en el cuerpo de la respuesta)*

#### Errores
- **403 Forbidden**: Solo administradores pueden eliminar clientes
- **404 Not Found**: Cliente no encontrado

---

### 6. Listar Clientes por Vendedor (Solo Admin)
**GET** `/api/v1/customers/by-seller/:sellerId`

Obtiene todos los clientes de un vendedor específico. Solo disponible para administradores.

#### Path Parameters
- `sellerId` (UUID): ID del vendedor

#### Query Parameters
| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `page` | number | No | 1 | Número de página |
| `limit` | number | No | 10 | Elementos por página |

#### Response - 200 OK
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Cliente del Vendedor",
      "email": "cliente@example.com",
      "seller": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Juan Pérez"
      }
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

## Endpoints de Direcciones

Los endpoints de direcciones permiten gestionar las direcciones físicas de los clientes. Cada cliente puede tener múltiples direcciones para entregas.

**Base URL:** `http://localhost:3000/api/v1/customers/:customerId/addresses`

### 1. Añadir Dirección a Cliente
**POST** `/api/v1/customers/:customerId/addresses`

Crea una nueva dirección para un cliente específico.

#### Path Parameters
- `customerId` (UUID): ID del cliente al que se añadirá la dirección

#### Headers
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

#### Request Body
```json
{
  "address": "5ta Avenida 10-20, Zona 10",
  "city": "Guatemala",
  "state": "Guatemala",
  "postalCode": "01001",
  "country": "Guatemala"
}
```

#### Response - 201 Created
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "address": "5ta Avenida 10-20, Zona 10",
  "city": "Guatemala",
  "state": "Guatemala",
  "postalCode": "01001",
  "country": "Guatemala",
  "createdAt": "2025-08-27T11:00:00.000Z",
  "customer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Comercial ABC S.A."
  }
}
```

#### Validaciones
- `address`: Requerido, 5-500 caracteres
- `city`: Opcional, máximo 100 caracteres
- `state`: Opcional, máximo 100 caracteres
- `postalCode`: Opcional, máximo 20 caracteres
- `country`: Opcional, máximo 100 caracteres

---

### 2. Listar Direcciones del Cliente
**GET** `/api/v1/customers/:customerId/addresses`

Obtiene todas las direcciones de un cliente específico.

#### Path Parameters
- `customerId` (UUID): ID del cliente

#### Response - 200 OK
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "address": "5ta Avenida 10-20, Zona 10",
    "city": "Guatemala",
    "state": "Guatemala",
    "postalCode": "01001",
    "country": "Guatemala",
    "createdAt": "2025-08-27T11:00:00.000Z"
  },
  {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "address": "Calzada Roosevelt 15-45, Zona 11",
    "city": "Guatemala",
    "state": "Guatemala",
    "postalCode": "01011",
    "country": "Guatemala",
    "createdAt": "2025-08-27T10:30:00.000Z"
  }
]
```

#### Ordenamiento
Las direcciones se devuelven ordenadas por fecha de creación (más recientes primero).

---

### 3. Obtener Dirección Específica
**GET** `/api/v1/customers/:customerId/addresses/:addressId`

Obtiene una dirección específica de un cliente.

#### Path Parameters
- `customerId` (UUID): ID del cliente
- `addressId` (UUID): ID de la dirección

#### Response - 200 OK
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "address": "5ta Avenida 10-20, Zona 10",
  "city": "Guatemala",
  "state": "Guatemala",
  "postalCode": "01001",
  "country": "Guatemala",
  "createdAt": "2025-08-27T11:00:00.000Z",
  "customer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Comercial ABC S.A."
  }
}
```

#### Errores
- **404 Not Found**: Dirección no encontrada o no pertenece al cliente
- **403 Forbidden**: Cliente no pertenece al vendedor autenticado

---

### 4. Actualizar Dirección
**PATCH** `/api/v1/customers/:customerId/addresses/:addressId`

Actualiza los datos de una dirección existente.

#### Path Parameters
- `customerId` (UUID): ID del cliente
- `addressId` (UUID): ID de la dirección

#### Request Body
```json
{
  "address": "6ta Avenida 15-25, Zona 10",
  "postalCode": "01002"
}
```

#### Response - 200 OK
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "address": "6ta Avenida 15-25, Zona 10",
  "city": "Guatemala",
  "state": "Guatemala",
  "postalCode": "01002",
  "country": "Guatemala",
  "createdAt": "2025-08-27T11:00:00.000Z",
  "customer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Comercial ABC S.A."
  }
}
```

#### Notas
- Permite actualización parcial de campos
- Solo se necesita enviar los campos que se desean modificar
- Las validaciones se aplican solo a los campos enviados

---

### 5. Eliminar Dirección
**DELETE** `/api/v1/customers/:customerId/addresses/:addressId`

Elimina una dirección específica de un cliente.

#### Path Parameters
- `customerId` (UUID): ID del cliente
- `addressId` (UUID): ID de la dirección

#### Response - 204 No Content
*(Sin contenido en el cuerpo de la respuesta)*

#### Errores
- **404 Not Found**: Dirección no encontrada o no pertenece al cliente
- **403 Forbidden**: Cliente no pertenece al vendedor autenticado

#### ⚠️ **Advertencia**
La eliminación es permanente y no se puede deshacer. Asegúrate de que la dirección no esté siendo utilizada en pedidos activos.

---

## Modelos de Datos

### Customer
```typescript
{
  id: string;                    // UUID del cliente
  name: string;                  // Nombre del cliente (2-150 chars)
  taxId?: string;               // NIT/ID fiscal (opcional, max 100 chars)
  email?: string;               // Email (opcional, max 150 chars)
  phone?: string;               // Teléfono (opcional, max 50 chars)
  contactPerson?: string;       // Persona de contacto (opcional, max 150 chars)
  notes?: string;               // Notas adicionales (opcional)
  createdAt: Date;              // Fecha de creación
  seller: User;                 // Vendedor asignado
  addresses: CustomerAddress[]; // Direcciones del cliente
  orders: Order[];              // Pedidos del cliente
}
```

### CustomerAddress
```typescript
{
  id: string;               // UUID de la dirección
  address: string;          // Dirección completa (5-500 chars)
  city?: string;           // Ciudad (opcional, max 100 chars)
  state?: string;          // Departamento/Estado (opcional, max 100 chars)
  postalCode?: string;     // Código postal (opcional, max 20 chars)
  country?: string;        // País (opcional, max 100 chars)
  createdAt: Date;         // Fecha de creación
  customer: Customer;      // Cliente propietario
  // orders: Order[];      // Pedidos enviados a esta dirección (futura implementación)
}
```

### CreateCustomerAddressDto
```typescript
{
  address: string;         // Requerido, 5-500 caracteres
  city?: string;          // Opcional, máximo 100 caracteres
  state?: string;         // Opcional, máximo 100 caracteres
  postalCode?: string;    // Opcional, máximo 20 caracteres
  country?: string;       // Opcional, máximo 100 caracteres
}
```

### UpdateCustomerAddressDto
```typescript
{
  address?: string;        // Opcional, 5-500 caracteres
  city?: string;          // Opcional, máximo 100 caracteres
  state?: string;         // Opcional, máximo 100 caracteres
  postalCode?: string;    // Opcional, máximo 20 caracteres
  country?: string;       // Opcional, máximo 100 caracteres
}
```

### PaginatedResponse
```typescript
{
  data: Customer[];    // Array de clientes
  meta: {
    total: number;        // Total de registros
    page: number;         // Página actual
    limit: number;        // Límite por página
    totalPages: number;   // Total de páginas
    hasNextPage: boolean; // Hay página siguiente
    hasPrevPage: boolean; // Hay página anterior
  }
}
```

---

## Códigos de Error

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "El nombre debe tener al menos 2 caracteres",
    "Debe proporcionar un email válido"
  ],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Token de acceso no válido",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Solo los administradores pueden eliminar clientes",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Cliente no encontrado",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Ya existe un cliente con este email",
  "error": "Conflict"
}
```

---

## Ejemplos de Uso

### Ejemplo 1: Crear un Cliente Completo
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "name": "Supermercado La Esperanza",
    "taxId": "987654-3",
    "email": "ventas@laesperanza.com",
    "phone": "+502 2234-5678",
    "contactPerson": "Ana García",
    "notes": "Cliente mayorista con descuentos especiales"
  }'
```

### Ejemplo 2: Búsqueda Avanzada
```bash
# Buscar clientes que contengan "super" y ordenar por nombre
curl -X GET "http://localhost:3000/api/v1/customers?search=super&sortBy=name&sortOrder=ASC&limit=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Ejemplo 3: Actualizar Cliente
```bash
curl -X PATCH http://localhost:3000/api/v1/customers/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "phone": "+502 8888-9999",
    "notes": "Cliente actualizado - nuevo teléfono"
  }'
```

### Ejemplo 5: Gestión Completa de Direcciones
```bash
# 1. Crear una dirección principal
curl -X POST http://localhost:3000/api/v1/customers/550e8400-e29b-41d4-a716-446655440000/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "address": "5ta Avenida 10-20, Zona 10",
    "city": "Guatemala",
    "state": "Guatemala",
    "postalCode": "01001",
    "country": "Guatemala"
  }'

# 2. Crear una dirección de entrega alternativa
curl -X POST http://localhost:3000/api/v1/customers/550e8400-e29b-41d4-a716-446655440000/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "address": "Calzada Roosevelt 15-45, Zona 11",
    "city": "Guatemala",
    "state": "Guatemala"
  }'

# 3. Listar todas las direcciones del cliente
curl -X GET http://localhost:3000/api/v1/customers/550e8400-e29b-41d4-a716-446655440000/addresses \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# 4. Actualizar código postal de una dirección
curl -X PATCH http://localhost:3000/api/v1/customers/550e8400-e29b-41d4-a716-446655440000/addresses/770e8400-e29b-41d4-a716-446655440002 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "postalCode": "01002"
  }'

# 5. Eliminar una dirección
curl -X DELETE http://localhost:3000/api/v1/customers/550e8400-e29b-41d4-a716-446655440000/addresses/770e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Ejemplo 6: Flujo Completo Cliente + Direcciones
```bash
# 1. Crear cliente
CUSTOMER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Ferretería El Martillo",
    "taxId": "555666-7",
    "email": "ventas@elmartillo.com",
    "phone": "+502 3333-4444"
  }')

# 2. Extraer ID del cliente (usando jq)
CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.id')

# 3. Añadir dirección principal
curl -X POST "http://localhost:3000/api/v1/customers/$CUSTOMER_ID/addresses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "address": "Avenida Elena 25-30, Zona 4",
    "city": "Guatemala",
    "state": "Guatemala",
    "postalCode": "01004",
    "country": "Guatemala"
  }'

# 4. Añadir sucursal
curl -X POST "http://localhost:3000/api/v1/customers/$CUSTOMER_ID/addresses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "address": "Centro Comercial Plaza Norte, Local 15",
    "city": "Mixco",
    "state": "Guatemala",
    "country": "Guatemala"
  }'
```

---

## Casos de Uso Comunes

### **Gestión de Múltiples Ubicaciones**
Los clientes pueden tener diferentes ubicaciones para:
- 🏢 **Oficina principal** - Dirección fiscal y administrativa
- 🏭 **Plantas de producción** - Entregas de materias primas
- 🏪 **Sucursales** - Distribución a puntos de venta
- 🏠 **Direcciones de entrega** - Ubicaciones específicas de clientes finales

### **Flujo Recomendado**
1. **Crear cliente** con información básica
2. **Añadir dirección principal** (obligatoria)
3. **Añadir direcciones adicionales** según necesidades
4. **Actualizar direcciones** cuando cambien ubicaciones
5. **Eliminar direcciones** obsoletas (con precaución)

### **Mejores Prácticas**
- ✅ Siempre incluir información de ciudad y país
- ✅ Usar códigos postales cuando estén disponibles
- ✅ Verificar direcciones antes de crear pedidos
- ✅ Mantener direcciones actualizadas
- ❌ No eliminar direcciones con pedidos asociados

---

## Permisos y Seguridad

### Vendedores (SELLER)
**Clientes:**
- ✅ Pueden crear clientes (se asignan automáticamente como vendedor)
- ✅ Pueden ver solo sus propios clientes
- ✅ Pueden actualizar solo sus propios clientes
- ❌ No pueden eliminar clientes
- ❌ No pueden ver clientes de otros vendedores

**Direcciones:**
- ✅ Pueden añadir direcciones a sus clientes
- ✅ Pueden ver direcciones de sus clientes
- ✅ Pueden actualizar direcciones de sus clientes
- ✅ Pueden eliminar direcciones de sus clientes
- ❌ No pueden gestionar direcciones de clientes de otros vendedores

### Administradores (ADMIN)
**Clientes:**
- ✅ Pueden crear clientes
- ✅ Pueden ver todos los clientes del sistema
- ✅ Pueden actualizar cualquier cliente
- ✅ Pueden eliminar clientes
- ✅ Pueden ver clientes por vendedor específico

**Direcciones:**
- ✅ Pueden gestionar direcciones de cualquier cliente
- ✅ Acceso completo a todas las operaciones de direcciones
- ✅ Pueden ver histórico de direcciones eliminadas (futura implementación)

---

## Notas Técnicas

### **Clientes**
1. **UUID**: Todos los IDs utilizan formato UUID v4
2. **Timestamps**: Todas las fechas están en formato ISO 8601 con timezone UTC
3. **Paginación**: Límite máximo de 100 elementos por página
4. **Búsqueda**: Utiliza ILIKE para búsquedas case-insensitive
5. **Soft Delete**: Los clientes eliminados se marcan como inactivos (implementación futura)
6. **Relaciones**: Se incluyen automáticamente seller y addresses en las respuestas

### **Direcciones**
1. **Cascada**: Las direcciones se eliminan automáticamente cuando se elimina un cliente
2. **Validación**: Campo address es obligatorio, resto opcionales
3. **Ordenamiento**: Por defecto ordenadas por createdAt DESC
4. **Relaciones**: Cada dirección pertenece a un único cliente
5. **Integridad**: Validación de permisos en cada operación
6. **Futuro**: Integración con sistema de pedidos y geolocalización

### **Consideraciones de Rendimiento**
- Las consultas de direcciones incluyen JOIN con customer para validación de permisos
- Se recomienda indexar customer_id en la tabla customer_addresses
- Para grandes volúmenes, considerar paginación en listado de direcciones

### **Limitaciones Actuales**
- No hay validación de formato de código postal por país
- No hay geocodificación automática de direcciones
- No hay validación de existencia real de direcciones
- Eliminación física de direcciones (considerar soft delete futuro)

---

*Documentación generada el 27 de agosto de 2025*
