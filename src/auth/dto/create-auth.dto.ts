import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class LoginDto {
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}

export class RegisterDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name: string;

  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol debe ser válido' })
  role?: UserRole;
}

export class RefreshTokenDto {
  @IsString({ message: 'El refresh token debe ser una cadena de texto' })
  refreshToken: string;
}

export class CreateAuthDto {}
