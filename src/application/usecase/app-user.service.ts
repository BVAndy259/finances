import { Inject, Injectable } from '@nestjs/common';
import { AppUser } from '../../domain/model/app-user';
import {
  APP_USER_REPOSITORY,
  AppUserRepositoryPort,
} from '../../domain/port/out/app-user.repository.port';

@Injectable()
export class AppUserService {
  constructor(
    @Inject(APP_USER_REPOSITORY)
    private readonly appUserRepository: AppUserRepositoryPort,
  ) {}

  getUserByTelegramId(telegramChatId: string): Promise<AppUser | null> {
    return this.appUserRepository.findByTelegramChatId(telegramChatId);
  }

  async registerUserIfNotExists(
    telegramChatId: string,
    alias: string,
  ): Promise<AppUser> {
    const existingUser =
      await this.appUserRepository.findByTelegramChatId(telegramChatId);

    if (existingUser) {
      return existingUser;
    }

    const newUser = new AppUser();
    newUser.telegramChatId = telegramChatId;
    newUser.alias = alias;
    return this.appUserRepository.save(newUser);
  }
}
