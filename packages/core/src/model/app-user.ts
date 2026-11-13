export class AppUser {
  id?: string;
  telegramChatId!: string;
  alias!: string;
  createdAt: Date = new Date();
}
