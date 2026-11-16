import { AppUser } from '../../model/app-user';

export const APP_USER_REPOSITORY = Symbol('APP_USER_REPOSITORY');

export interface AppUserRepositoryPort {
  save(user: AppUser): Promise<AppUser>;
  findById(id: string): Promise<AppUser | null>;
  findByEmail(email: string): Promise<AppUser | null>;
  findByTelegramChatId(telegramChatId: string): Promise<AppUser | null>;
}
