import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import type { UsersService } from '../users/users.service';
import type { User } from '../users/entities/user.entity';

// Isolate token issuance from persistence and the application's entity graph.
jest.mock('../users/users.service', () => ({ UsersService: class {} }));

describe('AuthService session duration', () => {
  const week = 7 * 24 * 60 * 60;
  const user = {
    id: 'test-user',
    email: 'seller@example.com',
    name: 'Seller',
    role: 'seller',
    isActive: true,
    createdAt: new Date(),
  } as User;

  it.each([undefined, '7d'])(
    'issues login and refresh tokens valid for a week with duration %s',
    async (duration) => {
      const jwt = new JwtService();
      const config = new ConfigService({
        JWT_SECRET: 'test-access-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EXPIRATION_TIME: duration,
        JWT_REFRESH_EXPIRATION_TIME: duration,
      });
      const users = {
        validateUser: jest.fn().mockResolvedValue(user),
        findOne: jest.fn().mockResolvedValue(user),
      } as unknown as UsersService;
      const service = new AuthService(users, jwt, config);
      const login = await service.login({ email: user.email, password: 'test' });
      const refreshed = await service.refreshToken({ refreshToken: login.refresh_token });

      for (const tokens of [login, refreshed]) {
        const access = jwt.verify(tokens.access_token, { secret: 'test-access-secret' });
        const refresh = jwt.verify(tokens.refresh_token, { secret: 'test-refresh-secret' });
        expect(access.exp - access.iat).toBe(week);
        expect(refresh.exp - refresh.iat).toBe(week);
        expect(() => jwt.verify(tokens.access_token, {
          secret: 'test-access-secret', clockTimestamp: access.iat + week - 1,
        })).not.toThrow();
        expect(() => jwt.verify(tokens.access_token, {
          secret: 'test-access-secret', clockTimestamp: access.iat + week,
        })).toThrow('jwt expired');
      }
    },
  );
});
