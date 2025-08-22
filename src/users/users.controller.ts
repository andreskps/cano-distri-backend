import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole, User } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard) // Proteger todas las rutas con autenticación JWT
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Solo los administradores pueden crear usuarios
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Solo los administradores pueden ver todos los usuarios
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  // Cualquier usuario autenticado puede ver su propio perfil
  async getMyProfile(@GetUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Solo los administradores pueden ver usuarios específicos
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  // Cualquier usuario puede actualizar su propio perfil (excepto ciertos campos)
  async updateMyProfile(
    @GetUser() user: User, 
    @Body() updateUserDto: Omit<UpdateUserDto, 'role' | 'isActive'>
  ) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Solo los administradores pueden actualizar cualquier usuario
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Solo los administradores pueden eliminar usuarios
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
