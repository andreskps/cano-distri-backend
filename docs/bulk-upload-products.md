# 📊 Carga Masiva de Productos - Guía de Uso

## Endpoint de Carga Masiva

**POST** `/api/v1/products/bulk-upload`

Este endpoint permite cargar múltiples productos desde un archivo Excel de forma eficiente.

### Autenticación
- **Requerida**: Sí (JWT Token)
- **Rol necesario**: ADMIN

### Formato del Archivo

#### Archivo Excel (.xlsx o .xls)
- **Primera fila**: Debe contener los encabezados de las columnas
- **Filas siguientes**: Datos de los productos

#### Columnas Requeridas
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `name` | Texto | Nombre del producto (2-200 caracteres) |
| `code` | Texto | Código único del producto |

#### Columnas Opcionales
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `price` | Número | Precio de venta |
| `costPrice` | Número | Precio de costo |
| `unit` | Texto | Unidad de medida (ej: kg, litro, unidad) |
| `notes` | Texto | Notas adicionales |

### Ejemplo de Archivo Excel

| name | code | price | costPrice | unit | notes |
|------|------|-------|-----------|------|-------|
| Coca Cola 600ml | CC-600 | 25.50 | 18.00 | unidad | Bebida gaseosa sabor original |
| Pepsi 500ml | PS-500 | 23.00 | 16.50 | unidad | Bebida gaseosa |
| Agua Pura 1L | AG-1000 | 8.00 | 5.50 | litro | Agua purificada |
| Café Premium | CF-001 | 85.00 | 62.00 | kg | Café molido de exportación |

### Formatos de Encabezados Aceptados

El sistema es flexible con los nombres de las columnas y acepta variaciones:

- **name**: `name`, `Name`, `NOMBRE`, `nombre`
- **code**: `code`, `Code`, `CODIGO`, `codigo`, `CÓDIGO`, `código`
- **price**: `price`, `Price`, `PRECIO`, `precio`, `precioVenta`, `precio_venta`
- **costPrice**: `costPrice`, `cost_price`, `PRECIO_COSTO`, `precio_costo`, `costo`
- **unit**: `unit`, `Unit`, `UNIDAD`, `unidad`
- **notes**: `notes`, `Notes`, `NOTAS`, `notas`, `observaciones`

### Respuesta del Endpoint

```json
{
  "totalProcessed": 4,
  "successCount": 3,
  "errorCount": 1,
  "errors": [
    {
      "row": 3,
      "error": "El código 'CC-600' ya existe en la base de datos",
      "data": {
        "name": "Coca Cola 600ml",
        "code": "CC-600",
        "price": "25.50"
      }
    }
  ],
  "createdProducts": [
    "PS-500",
    "AG-1000", 
    "CF-001"
  ]
}
```

### Validaciones Realizadas

#### A Nivel de Archivo
- ✅ Formato de archivo (debe ser .xlsx o .xls)
- ✅ Presencia de encabezados requeridos
- ✅ Al menos una fila de datos

#### A Nivel de Producto
- ✅ **Nombre**: Requerido, 2-200 caracteres
- ✅ **Código**: Requerido, único en la base de datos
- ✅ **Precios**: Números válidos, no negativos
- ✅ **Unidad**: Máximo 50 caracteres
- ✅ **Duplicados**: No se permiten códigos duplicados en el mismo archivo

### Códigos de Error Comunes

| Error | Descripción | Solución |
|-------|-------------|----------|
| `El código 'XXX' ya existe` | Producto duplicado en BD | Cambiar el código del producto |
| `El nombre del producto es requerido` | Campo name vacío | Completar el nombre |
| `El código del producto es requerido` | Campo code vacío | Completar el código |
| `Precio inválido: XXX` | Precio no numérico | Usar números válidos |
| `El precio no puede ser negativo` | Precio menor a 0 | Usar valores positivos |

### Ejemplo de Uso con cURL

```bash
curl -X POST http://localhost:3000/api/v1/products/bulk-upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@productos.xlsx"
```

### Ejemplo de Uso con JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/v1/products/bulk-upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
```

### Recomendaciones

1. **Validar datos antes de subir**: Revisa que los códigos sean únicos
2. **Archivos pequeños**: Procesa máximo 1000 productos por archivo
3. **Backup**: Respalda la base de datos antes de cargas masivas grandes
4. **Revisión de errores**: Siempre revisa la lista de errores en la respuesta
5. **Formato de precios**: Usa punto (.) como separador decimal

### Plantilla de Excel

Puedes descargar una plantilla de Excel con el formato correcto desde:
- [Plantilla de Productos.xlsx](./plantilla-productos.xlsx)

---

*Para más información sobre la API de productos, consulta la documentación completa en `/api/docs`*
