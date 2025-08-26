# API de Productos - Cano Distribuciones Backend

Este documento describe todos los endpoints disponibles para la gestión de productos en el sistema.

## Características del Módulo de Productos

✅ **CRUD Completo** - Crear, leer, actualizar y eliminar productos  
✅ **Paginación** - Listado paginado con filtros y ordenamiento  
✅ **Validación Robusta** - Validación de entrada con class-validator  
✅ **Autorización** - Control de acceso basado en roles  
✅ **Búsqueda y Filtros** - Búsqueda por nombre y código  
✅ **Códigos Únicos** - Cada producto tiene un código único  
✅ **Múltiples Precios** - Precio de venta, costo y sugerido  
✅ **Respuestas Consistentes** - DTOs tipados para todas las respuestas  

## Base URL

```
http://localhost:3000/api/v1/products
```

## Autenticación

Todos los endpoints requieren autenticación JWT. Incluye el token en el header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Estructura del Producto

```json
{
  "id": "uuid-here",
  "name": "Producto ABC",
  "code": "PRD-001",
  "price": "25.50",
  "costPrice": "15.00",
  "suggestedPrice": "30.00",
  "unit": "kg",
  "notes": "Producto de calidad premium",
  "isActive": true,
  "createdAt": "2025-01-22T10:30:00Z"
}
```

## Endpoints Disponibles

### 1. Listar Productos (Paginado)

```http
GET /api/v1/products
```

**Query Parameters:**
- `page` (opcional) - Número de página (default: 1)
- `limit` (opcional) - Elementos por página (default: 10, max: 100)
- `search` (opcional) - Buscar por nombre o código
- `sortBy` (opcional) - Campo para ordenar (name, price, code, createdAt)
- `sortOrder` (opcional) - Orden ASC/DESC (default: ASC)
- `isActive` (opcional) - Filtrar por productos activos (true/false)

**Ejemplo de Request:**
```http
GET /api/v1/products?page=1&limit=20&search=ABC&sortBy=name&sortOrder=DESC
```

**Respuesta Exitosa (200):**
```json
{
  "data": [
    {
      "id": "uuid-here",
      "name": "Producto ABC",
      "code": "PRD-001", 
      "price": "25.50",
      "costPrice": "15.00",
      "suggestedPrice": "30.00",
      "unit": "kg",
      "notes": "Producto de calidad premium",
      "isActive": true,
      "createdAt": "2025-01-22T10:30:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Roles Permitidos:** ADMIN, SELLER

---

### 2. Obtener Producto por ID

```http
GET /api/v1/products/:id
```

**Path Parameters:**
- `id` (requerido) - UUID del producto

**Ejemplo de Request:**
```http
GET /api/v1/products/123e4567-e89b-12d3-a456-426614174000
```

**Respuesta Exitosa (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Producto ABC",
  "code": "PRD-001",
  "price": "25.50",
  "costPrice": "15.00", 
  "suggestedPrice": "30.00",
  "unit": "kg",
  "notes": "Producto de calidad premium",
  "isActive": true,
  "createdAt": "2025-01-22T10:30:00Z"
}
```

**Errores Posibles:**
- `404 Not Found` - Producto no encontrado
- `401 Unauthorized` - Token inválido
- `403 Forbidden` - Sin permisos

**Roles Permitidos:** ADMIN, SELLER

---

### 3. Crear Producto

```http
POST /api/v1/products
```

**Body (JSON):**
```json
{
  "name": "Producto ABC",
  "code": "PRD-001",
  "price": "25.50",
  "costPrice": "15.00",
  "suggestedPrice": "30.00",
  "unit": "kg",
  "notes": "Producto de calidad premium",
  "isActive": true
}
```

**Validaciones según CreateProductDto:**
- `name` - Requerido, string, 2-200 caracteres
- `code` - Requerido, string único, mínimo 1 carácter
- `price` - Opcional, string numérico (ej: "25.50")
- `costPrice` - Opcional, string numérico (ej: "15.00")
- `suggestedPrice` - Opcional, string numérico (ej: "30.00")
- `unit` - Opcional, string, máximo 50 caracteres (ej: "kg", "litros")
- `notes` - Opcional, string de texto libre
- `isActive` - Opcional, boolean (default: true)

**Respuesta Exitosa (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Producto ABC",
  "code": "PRD-001",
  "price": "25.50",
  "costPrice": "15.00",
  "suggestedPrice": "30.00",
  "unit": "kg",
  "notes": "Producto de calidad premium",
  "isActive": true,
  "createdAt": "2025-01-22T10:30:00Z"
}
```

**Errores Posibles:**
- `400 Bad Request` - Datos de validación incorrectos
- `409 Conflict` - Código duplicado
- `401 Unauthorized` - Token inválido
- `403 Forbidden` - Sin permisos (solo ADMIN)

**Roles Permitidos:** ADMIN

---

### 4. Actualizar Producto

```http
PUT /api/v1/products/:id
PATCH /api/v1/products/:id
```

**Path Parameters:**
- `id` (requerido) - UUID del producto

**Body (JSON) - Actualización Completa (PUT):**
```json
{
  "name": "Producto ABC Actualizado",
  "code": "PRD-001-V2",
  "price": "27.50",
  "costPrice": "16.00",
  "suggestedPrice": "32.00",
  "unit": "kg",
  "notes": "Producto actualizado",
  "isActive": true
}
```

**Body (JSON) - Actualización Parcial (PATCH):**
```json
{
  "price": "27.50",
  "suggestedPrice": "32.00"
}
```

**Respuesta Exitosa (200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Producto ABC Actualizado",
  "code": "PRD-001-V2",
  "price": "27.50",
  "costPrice": "16.00",
  "suggestedPrice": "32.00",
  "unit": "kg",
  "notes": "Producto actualizado",
  "isActive": true,
  "createdAt": "2025-01-22T10:30:00Z"
}
```

**Errores Posibles:**
- `400 Bad Request` - Datos de validación incorrectos
- `404 Not Found` - Producto no encontrado
- `409 Conflict` - Código duplicado
- `401 Unauthorized` - Token inválido
- `403 Forbidden` - Sin permisos (solo ADMIN)

**Roles Permitidos:** ADMIN

---

### 5. Eliminar Producto

```http
DELETE /api/v1/products/:id
```

**Path Parameters:**
- `id` (requerido) - UUID del producto

**Respuesta Exitosa (200):**
```json
{
  "message": "Producto eliminado exitosamente",
  "id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Respuesta Sin Contenido (204):**
No body - Solo status code

**Errores Posibles:**
- `404 Not Found` - Producto no encontrado
- `401 Unauthorized` - Token inválido
- `403 Forbidden` - Sin permisos (solo ADMIN)

**Roles Permitidos:** ADMIN

---

### 6. Buscar Productos

```http
GET /api/v1/products/search
```

**Query Parameters:**
- `q` (requerido) - Término de búsqueda
- `page` (opcional) - Número de página (default: 1)
- `limit` (opcional) - Elementos por página (default: 10)

**Ejemplo de Request:**
```http
GET /api/v1/products/search?q=ABC&page=1&limit=20
```

**Respuesta:** Igual formato que el listado paginado

**Roles Permitidos:** ADMIN, SELLER

---

### 7. Obtener Producto por Código

```http
GET /api/v1/products/code/:code
```

**Path Parameters:**
- `code` (requerido) - Código único del producto

**Ejemplo de Request:**
```http
GET /api/v1/products/code/PRD-001
```

**Respuesta:** Igual formato que obtener por ID

**Roles Permitidos:** ADMIN, SELLER

---

## Códigos de Error Comunes

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado exitosamente |
| 204 | No Content - Eliminación exitosa |
| 400 | Bad Request - Datos de entrada inválidos |
| 401 | Unauthorized - Token inválido o ausente |
| 403 | Forbidden - Sin permisos para la operación |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: código duplicado) |
| 422 | Unprocessable Entity - Error de validación |
| 500 | Internal Server Error - Error del servidor |

## Ejemplo de Uso con Redux (Next.js)

### 1. Configuración del Store

```javascript
// store/productsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ page = 1, limit = 10, search, sortBy, sortOrder, isActive }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) queryParams.append('search', search);
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (sortOrder) queryParams.append('sortOrder', sortOrder);
      if (isActive !== undefined) queryParams.append('isActive', isActive.toString());

      const response = await fetch(`/api/v1/products?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch('/api/v1/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear producto');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, ...updateData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`/api/v1/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar producto');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    currentProduct: null,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentProduct, clearCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer;
```

### 2. Uso en Componente

```javascript
// components/ProductList.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../store/productsSlice';

export default function ProductList() {
  const dispatch = useDispatch();
  const { items, loading, error, pagination } = useSelector(state => state.products);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchProducts({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(fetchProducts({ page: 1, limit: 20, search }));
  };

  if (loading) return <div>Cargando productos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Productos</h1>
      
      {/* Búsqueda */}
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código..."
        />
        <button type="submit">Buscar</button>
      </form>

      {/* Lista de productos */}
      {items.map(product => (
        <div key={product.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}>
          <h3>{product.name}</h3>
          <p><strong>Código:</strong> {product.code}</p>
          <p><strong>Precio:</strong> ${product.price || 'No definido'}</p>
          <p><strong>Precio de Costo:</strong> ${product.costPrice || 'No definido'}</p>
          <p><strong>Precio Sugerido:</strong> ${product.suggestedPrice || 'No definido'}</p>
          <p><strong>Unidad:</strong> {product.unit || 'No especificada'}</p>
          {product.notes && <p><strong>Notas:</strong> {product.notes}</p>}
          <p><strong>Estado:</strong> {product.isActive ? 'Activo' : 'Inactivo'}</p>
        </div>
      ))}
      
      {/* Paginación */}
      <div>
        <p>Página {pagination.page} de {pagination.totalPages}</p>
        <p>Total: {pagination.total} productos</p>
      </div>
    </div>
  );
}
```

## Notas Adicionales

- Los precios se almacenan como strings para mantener precisión decimal
- El campo `code` debe ser único en todo el sistema
- Todos los campos de precio son opcionales
- El campo `unit` permite especificar la unidad de medida (kg, litros, unidades, etc.)
- El campo `notes` permite agregar información adicional del producto
- Los productos tienen un flag `isActive` para soft delete/activación