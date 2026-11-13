import { Controller, Get } from '@nestjs/common';

@Controller()
export class PingController {
  @Get('/')
  keepAlive(): string {
    return 'El servidor del bot está despierto y funcionando.';
  }
}
