import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hash de la contraseña
    const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '12');
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Crear el usuario
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'role', 'isActive', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Si se está actualizando la contraseña, hashearla
    if (updateUserDto.password) {
      const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '12');
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    const result = await this.userRepository.update(id, updateUserDto);

    if (result.affected === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    // Soft delete: marcar el usuario como inactivo en lugar de borrarlo físicamente
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!user.isActive) {
      // Si ya está inactivo, no hacemos nada
      return;
    }

    await this.userRepository.update(id, { isActive: false });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.findOneByEmail(email);
      
      if (!user.isActive) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (isPasswordValid) {
        // Remover la contraseña del objeto retornado
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}
