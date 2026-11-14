import { DatabaseHealthPort } from '@expense-tracker/core';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let databaseHealth: jest.Mocked<DatabaseHealthPort>;

  beforeEach(() => {
    databaseHealth = {
      ping: jest.fn(),
    };
    service = new HealthService(databaseHealth);
  });

  it('reporta ok cuando la base de datos responde', async () => {
    databaseHealth.ping.mockResolvedValue(true);

    const health = await service.check();

    expect(health.status).toBe('ok');
    expect(health.database).toBe('up');
    expect(health.uptime).toEqual(expect.any(Number));
    expect(Number.isNaN(Date.parse(health.timestamp))).toBe(false);
  });

  it('reporta degraded cuando la base de datos no responde', async () => {
    databaseHealth.ping.mockResolvedValue(false);

    const health = await service.check();

    expect(health.status).toBe('degraded');
    expect(health.database).toBe('down');
  });

  it('reporta degraded si el ping lanza un error', async () => {
    databaseHealth.ping.mockRejectedValue(new Error('connection refused'));

    const health = await service.check();

    expect(health.status).toBe('degraded');
    expect(health.database).toBe('down');
  });
});
