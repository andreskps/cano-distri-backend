# Sistema de Autenticación - Cano Distribuciones Backend

Este documento describe el sistema de autenticación implementado en el backend de Cano Distribuciones.

## Características del Sistema

✅ **Autenticación JWT** - Tokens seguros con expiración configurable  
✅ **Refresh Tokens** - Renovación automática de tokens sin re-login  
✅ **Autorización por Roles** - Control de acceso basado en roles (ADMIN, SELLER)  
✅ **Validación Robusta** - Validación de entrada con class-validator  
✅ **Hashing Seguro** - Contraseñas hasheadas con bcrypt (12 rounds)  
✅ **Guards Personalizados** - Protección de rutas con guards reutilizables  
✅ **Decoradores Útiles** - @GetUser(), @Roles() para facilitar el desarrollo  
✅ **Manejo de Errores** - Filtros globales para respuestas consistentes  

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=cano_distri_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-please-change-this-in-production
JWT_EXPIRATION_TIME=8h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-please-change-this-in-production
JWT_REFRESH_EXPIRATION_TIME=7d

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=12

# Application Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Endpoints de Autenticación

### 1. Registro de Usuario
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "role": "seller" // opcional, por defecto es "seller"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "seller",
    "isActive": true,
    "createdAt": "2025-01-22T..."
  }
}
```

### 2. Inicio de Sesión
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Respuesta:** Igual que el registro

### 3. Renovar Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta:**
```json
{
  "access_token": "nuevo-access-token...",
  "refresh_token": "nuevo-refresh-token..."
}
```

### 4. Obtener Perfil
```http
GET /api/v1/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Validar Token
```http
POST /api/v1/auth/validate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Protección de Rutas

### Usando Guards

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { GetUser } from './auth/decorators/get-user.decorator';
import { UserRole, User } from './users/entities/user.entity';

@Controller('products')
@UseGuards(JwtAuthGuard) // Proteger todo el controlador
export class ProductsController {
  
  @Get()
  // Cualquier usuario autenticado puede ver productos
  findAll(@GetUser() user: User) {
    return this.productsService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Solo administradores pueden crear productos
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }
}
```

### Decoradores Disponibles

- `@GetUser()` - Obtiene el usuario actual
- `@GetUser('id')` - Obtiene solo el ID del usuario
- `@Roles(UserRole.ADMIN, UserRole.SELLER)` - Define roles permitidos

## Roles de Usuario

- `ADMIN` - Acceso completo al sistema
- `SELLER` - Acceso limitado para vendedores

## Estructura del Token JWT

```json
{
  "sub": "user-uuid-here",
  "email": "user@example.com", 
  "role": "admin",
  "iat": 1642781234,
  "exp": 1642810034
}
```

## Mejores Prácticas Implementadas

1. **Seguridad:**
   - Contraseñas hasheadas con bcrypt (12 rounds)
   - Tokens JWT con expiración corta (8h por defecto)
   - Refresh tokens para renovación automática
   - Validación de usuarios activos en cada request

2. **Validación:**
   - DTOs con class-validator para validación robusta
   - Pipes globales para transformación automática
   - Manejo consistente de errores

3. **Arquitectura:**
   - Separación clara de responsabilidades
   - Guards reutilizables
   - Decoradores personalizados para mejor DX
   - Configuración centralizada con ConfigService

## Ejemplos de Uso en Frontend

### JavaScript/TypeScript
```javascript
// Login
const loginResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { access_token, refresh_token, user } = await loginResponse.json();

// Guardar tokens
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);

// Usar token en requests
const response = await fetch('/api/v1/products', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});

// Renovar token cuando expire
const refreshResponse = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: localStorage.getItem('refresh_token')
  })
});
```

## Troubleshooting

### Error: "Token inválido"
- Verificar que el token no haya expirado
- Asegurar que el JWT_SECRET sea el mismo en desarrollo y producción
- Verificar que el usuario esté activo

### Error: "No tienes permisos"
- Verificar que el usuario tenga el rol correcto
- Revisar que los decoradores @Roles() estén configurados correctamente

### Error: "Usuario no encontrado"
- Verificar que el usuario exista en la base de datos
- Confirmar que el ID del usuario en el token sea válido
