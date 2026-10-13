import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
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

  it('preserves database errors instead of declaring the session invalid', async () => {
    const failure = new Error('Database temporarily unavailable');
    const jwt = new JwtService();
    const config = new ConfigService({ JWT_REFRESH_SECRET: 'test-refresh-secret' });
    const users = { findOne: jest.fn().mockRejectedValue(failure) } as unknown as UsersService;
    const service = new AuthService(users, jwt, config);
    const refreshToken = jwt.sign({ sub: user.id }, { secret: 'test-refresh-secret', expiresIn: '7d' });
    await expect(service.refreshToken({ refreshToken })).rejects.toBe(failure);
  });

  it('still rejects expired refresh tokens, deleted users and inactive users', async () => {
    const jwt = new JwtService();
    const config = new ConfigService({ JWT_REFRESH_SECRET: 'test-refresh-secret' });
    const findOne = jest.fn();
    const service = new AuthService({ findOne } as unknown as UsersService, jwt, config);
    const expired = jwt.sign({ sub: user.id }, { secret: 'test-refresh-secret', expiresIn: -1 });
    await expect(service.refreshToken({ refreshToken: expired })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findOne).not.toHaveBeenCalled();
    const refreshToken = jwt.sign({ sub: user.id }, { secret: 'test-refresh-secret', expiresIn: '7d' });
    findOne.mockRejectedValueOnce(new NotFoundException());
    await expect(service.refreshToken({ refreshToken })).rejects.toBeInstanceOf(UnauthorizedException);
    findOne.mockResolvedValueOnce({ ...user, isActive: false });
    await expect(service.refreshToken({ refreshToken })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('preserves token issuance errors so renewal can be retried', async () => {
    const failure = new Error('Signing temporarily unavailable');
    const jwt = new JwtService();
    const config = new ConfigService({ JWT_REFRESH_SECRET: 'test-refresh-secret' });
    const service = new AuthService({ findOne: jest.fn().mockResolvedValue(user) } as unknown as UsersService, jwt, config);
    const refreshToken = jwt.sign({ sub: user.id }, { secret: 'test-refresh-secret', expiresIn: '7d' });
    jest.spyOn(jwt, 'signAsync').mockRejectedValue(failure);
    await expect(service.refreshToken({ refreshToken })).rejects.toBe(failure);
  });
});
