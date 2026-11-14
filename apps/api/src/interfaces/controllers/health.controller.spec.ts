import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  HealthService,
  HealthStatus,
} from '../../application/usecase/health.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: jest.Mocked<HealthService>;

  const healthy: HealthStatus = {
    status: 'ok',
    uptime: 10,
    timestamp: new Date().toISOString(),
    database: 'up',
  };

  beforeEach(async () => {
    healthService = {
      check: jest.fn(),
    } as unknown as jest.Mocked<HealthService>;

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('devuelve el estado cuando la base de datos está arriba', async () => {
    healthService.check.mockResolvedValue(healthy);

    await expect(controller.check()).resolves.toEqual(healthy);
  });

  it('responde 503 cuando la base de datos está caída', async () => {
    healthService.check.mockResolvedValue({
      ...healthy,
      status: 'degraded',
      database: 'down',
    });

    await expect(controller.check()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
