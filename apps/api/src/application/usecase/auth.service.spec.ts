import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  Account,
  AccountRepositoryPort,
  AppUser,
  AppUserRepositoryPort,
  UnitOfWorkPort,
} from '@expense-tracker/core';
import { AuthService } from './auth.service';

const CONFIG_VALUES: Record<string, string> = {
  jwtAccessSecret: 'test-access-secret',
  jwtAccessExpiresIn: '15m',
  jwtRefreshSecret: 'test-refresh-secret',
  jwtRefreshExpiresIn: '7d',
};

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<AppUserRepositoryPort>;
  let accounts: jest.Mocked<AccountRepositoryPort>;
  let unitOfWork: UnitOfWorkPort;
  let store: AppUser | null;

  beforeEach(() => {
    store = null;

    users = {
      save: jest.fn((user: AppUser) => {
        store = { ...user, id: user.id ?? 'user-1' };
        return Promise.resolve(store);
      }),
      findById: jest.fn((id: string) =>
        Promise.resolve(store?.id === id ? store : null),
      ),
      findByEmail: jest.fn((email: string) =>
        Promise.resolve(store?.email === email ? store : null),
      ),
      findByTelegramChatId: jest.fn(),
    };

    accounts = {
      save: jest.fn((account: Account) =>
        Promise.resolve({ ...account, id: 'account-1' }),
      ),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      delete: jest.fn(),
    };

    unitOfWork = {
      run: <T>(work: () => Promise<T>) => work(),
    };

    const configService = {
      get: (key: string) => CONFIG_VALUES[key],
    } as unknown as ConfigService;

    service = new AuthService(
      users,
      accounts,
      unitOfWork,
      new JwtService(),
      configService,
    );
  });

  it('registra un usuario, hashea la contraseña y crea la cuenta por defecto', async () => {
    const tokens = await service.register({
      email: '  User@Example.com ',
      password: 'secret123',
      alias: 'Andy',
    });

    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
    expect(store?.email).toBe('user@example.com');
    expect(store?.alias).toBe('Andy');
    expect(store?.passwordHash).not.toBe('secret123');
    expect(store?.refreshTokenHash).toEqual(expect.any(String));
    expect(accounts.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', name: 'Efectivo' }),
    );
  });

  it('rechaza registrar un email duplicado', async () => {
    await service.register({
      email: 'andy@example.com',
      password: 'secret123',
    });

    await expect(
      service.register({ email: 'ANDY@example.com', password: 'another123' }),
    ).rejects.toThrow(ConflictException);
  });

  it('inicia sesión con credenciales válidas y rechaza inválidas', async () => {
    await service.register({
      email: 'andy@example.com',
      password: 'secret123',
    });

    const tokens = await service.login('ANDY@example.com', 'secret123');
    expect(tokens.accessToken).toBeTruthy();

    await expect(
      service.login('andy@example.com', 'wrong-password'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rota el refresh token y rechaza el token anterior', async () => {
    const first = await service.register({
      email: 'andy@example.com',
      password: 'secret123',
    });
    const previousHash = store?.refreshTokenHash;

    const second = await service.refresh(first.refreshToken);

    expect(second.accessToken).toBeTruthy();
    expect(second.refreshToken).not.toBe(first.refreshToken);
    expect(store?.refreshTokenHash).not.toBe(previousHash);
    await expect(service.refresh(first.refreshToken)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza un refresh token inválido', async () => {
    await expect(service.refresh('not-a-jwt')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('limpia el refresh token al cerrar sesión', async () => {
    await service.register({
      email: 'andy@example.com',
      password: 'secret123',
    });

    await service.logout('user-1');

    expect(store?.refreshTokenHash).toBeNull();
  });

  it('rechaza el perfil de un usuario inexistente', async () => {
    await expect(service.getProfile('missing')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
