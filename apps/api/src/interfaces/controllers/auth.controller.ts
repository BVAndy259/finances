import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AppUser } from '@expense-tracker/core';
import {
  AuthService,
  AuthTokens,
} from '../../application/usecase/auth.service';
import { CurrentUser } from '../../infrastructure/auth/current-user.decorator';
import { Public } from '../../infrastructure/auth/public.decorator';
import {
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  UpdateCredentialsDto,
} from './dto/auth.dto';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface PublicUser {
  id?: string;
  email: string | null;
  telegramChatId: string | null;
  alias: string;
  createdAt: Date;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const tokens = await this.authService.register(dto);
    return this.respondWithTokens(response, tokens);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const tokens = await this.authService.login(dto.email, dto.password);
    return this.respondWithTokens(response, tokens);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const refreshToken =
      (request.cookies?.[REFRESH_COOKIE] as string | undefined) ??
      dto.refreshToken ??
      '';
    const tokens = await this.authService.refresh(refreshToken);
    return this.respondWithTokens(response, tokens);
  }

  @Patch('credentials')
  async updateCredentials(
    @CurrentUser() user: AppUser,
    @Body() dto: UpdateCredentialsDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const tokens = await this.authService.updateCredentials(user.id!, dto);
    return this.respondWithTokens(response, tokens);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AppUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(user.id!);
    response.clearCookie(REFRESH_COOKIE, { path: '/auth' });
  }

  @Get('me')
  me(@CurrentUser() user: AppUser): PublicUser {
    return this.toPublicUser(user);
  }

  private respondWithTokens(
    response: Response,
    tokens: AuthTokens,
  ): { accessToken: string; user: PublicUser } {
    const secure = this.configService.get<boolean>('cookieSecure') ?? false;

    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
      path: '/auth',
      maxAge: REFRESH_MAX_AGE_MS,
    });

    return {
      accessToken: tokens.accessToken,
      user: this.toPublicUser(tokens.user),
    };
  }

  private toPublicUser(user: AppUser): PublicUser {
    return {
      id: user.id,
      email: user.email,
      telegramChatId: user.telegramChatId,
      alias: user.alias,
      createdAt: user.createdAt,
    };
  }
}
