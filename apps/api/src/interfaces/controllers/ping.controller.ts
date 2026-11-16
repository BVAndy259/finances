import { Controller, Get } from '@nestjs/common';
import { Public } from '../../infrastructure/auth/public.decorator';

@Controller()
export class PingController {
  @Public()
  @Get('/')
  keepAlive(): string {
    return 'El servidor del bot está despierto y funcionando.';
  }
}
