export class AppUser {
  id?: number;
  telegramChatId!: string;
  alias!: string;
  createdAt: Date = new Date();
}
