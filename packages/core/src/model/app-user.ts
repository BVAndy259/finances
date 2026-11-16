export class AppUser {
  id?: string;
  email: string | null = null;
  passwordHash: string | null = null;
  refreshTokenHash: string | null = null;
  telegramChatId: string | null = null;
  alias!: string;
  createdAt: Date = new Date();
}
