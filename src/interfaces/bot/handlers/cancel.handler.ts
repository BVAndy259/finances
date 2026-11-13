import { Injectable } from '@nestjs/common';
import { resetSession } from '../bot.helpers';
import { BotContext } from '../bot.types';

@Injectable()
export class CancelHandler {
  async handle(ctx: BotContext): Promise<void> {
    resetSession(ctx);
    await ctx.reply(
      'Operación cancelada. Escribe /comandos para ver las opciones.',
    );
  }
}
