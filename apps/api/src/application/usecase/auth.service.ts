import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { hash, verify } from '@node-rs/argon2';
import {
  Account,
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
  AppUser,
  APP_USER_REPOSITORY,
  AppUserRepositoryPort,
  UNIT_OF_WORK,
  UnitOfWorkPort,
} from '@expense-tracker/core';
import { createHash, randomUUID } from 'node:crypto';

export interface RegisterInput {
  email: string;
  password: string;
  alias?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AppUser;
}

interface RefreshPayload {
  sub: string;
  type: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(APP_USER_REPOSITORY)
    private readonly appUserRepository: AppUserRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(input: RegisterInput): Promise<AuthTokens> {
    const email = this.normalizeEmail(input.email);
    const existingUser = await this.appUserRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const user = new AppUser();
    user.email = email;
    user.passwordHash = await hash(input.password);
    user.alias = input.alias?.trim() || email.split('@')[0];

    const savedUser = await this.unitOfWork.run(async () => {
      const createdUser = await this.appUserRepository.save(user);

      const account = new Account();
      account.userId = createdUser.id!;
      account.name = 'Efectivo';
      await this.accountRepository.save(account);

      return createdUser;
    });

    return this.issueTokens(savedUser);
  }

  async login(emailInput: string, password: string): Promise<AuthTokens> {
    const email = this.normalizeEmail(emailInput);
    const user = await this.appUserRepository.findByEmail(email);

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatches = await verify(user.passwordHash, password).catch(
      () => false,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token requerido');
    }

    let payload: RefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('jwtRefreshSecret'),
        },
      );
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const user = await this.appUserRepository.findById(payload.sub);
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (this.hashToken(refreshToken) !== user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    const user = await this.appUserRepository.findById(userId);
    if (!user) {
      return;
    }

    user.refreshTokenHash = null;
    await this.appUserRepository.save(user);
  }

  async getProfile(userId: string): Promise<AppUser> {
    const user = await this.appUserRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return user;
  }

  private async issueTokens(user: AppUser): Promise<AuthTokens> {
    const payload = { sub: user.id!, email: user.email };

    const accessToken = await this.jwtService.signAsync(
      { ...payload, jti: randomUUID() },
      {
        secret: this.configService.get<string>('jwtAccessSecret'),
        expiresIn: this.configService.get<string>(
          'jwtAccessExpiresIn',
        ) as JwtSignOptions['expiresIn'],
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { ...payload, type: 'refresh', jti: randomUUID() },
      {
        secret: this.configService.get<string>('jwtRefreshSecret'),
        expiresIn: this.configService.get<string>(
          'jwtRefreshExpiresIn',
        ) as JwtSignOptions['expiresIn'],
      },
    );

    user.refreshTokenHash = this.hashToken(refreshToken);
    await this.appUserRepository.save(user);

    return { accessToken, refreshToken, user };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
