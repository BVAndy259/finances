import { Injectable } from '@nestjs/common';
import { BotContext } from '../bot.types';

const HELP_TEXT = `Comandos Disponibles:

/gasto - Registrar un gasto
/ingreso - Registrar un ingreso
/transferir - Mover dinero entre cuentas
/prestar - Prestar dinero a alguien
/cobrar - Registrar que te pagaron un préstamo
/prestamos - Ver quién te debe dinero
/saldo - Ver saldo total
/cuentas - Ver todas tus cuentas
/nuevacuenta - Crear una cuenta
/cancelar - Cancelar operación`;

@Injectable()
export class HelpHandler {
  async handle(ctx: BotContext): Promise<void> {
    await ctx.reply(HELP_TEXT);
  }
}
