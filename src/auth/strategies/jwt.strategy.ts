import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'supersecret123',
    });
  }

  async validate(payload: JwtPayload) {
    const { sub: userId, email } = payload;

    // Verificar que el usuario existe y está activo
    const user = await this.usersService.findOne(userId);
    
    if (!user) {
      throw new UnauthorizedException('Token inválido');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Verificar que el email del token coincide con el del usuario
    if (user.email !== email) {
      throw new UnauthorizedException('Token inválido');
    }

    // Retornar el usuario sin la contraseña (ya que está excluida por defecto)
    return user;
  }
}