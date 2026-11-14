import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  HealthService,
  HealthStatus,
} from '../../application/usecase/health.service';
import { Public } from '../../infrastructure/auth/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  async check(): Promise<HealthStatus> {
    const health = await this.healthService.check();

    if (health.database !== 'up') {
      throw new ServiceUnavailableException(health);
    }

    return health;
  }
}
