import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/create-auth.dto';
import { AuthResponseDto, RefreshResponseDto } from './dto/auth-response.dto';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Validar las credenciales del usuario
    const user = await this.usersService.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    try {
      // Crear el usuario
      const user = await this.usersService.create(registerDto);

      // Generar tokens
      const tokens = await this.generateTokens(user);

      return {
        ...tokens,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error('Error al registrar el usuario');
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshResponseDto> {
    try {
      // Verificar el refresh token
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Buscar el usuario y verificar que esté activo
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user.isActive) {
        throw new UnauthorizedException('Usuario inactivo');
      }

      // Generar nuevos tokens
      return await this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  private async generateTokens(user: User): Promise<{ access_token: string; refresh_token: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      // Access token
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRATION_TIME') || '8h',
      }),
      // Refresh token
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME') || '7d',
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.usersService.findOne(payload.sub);
      return user.isActive ? user : null;
    } catch (error) {
      return null;
    }
  }
}
