import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_HEALTH, DatabaseHealthPort } from '@expense-tracker/core';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  uptime: number;
  timestamp: string;
  database: 'up' | 'down';
}

@Injectable()
export class HealthService {
  constructor(
    @Inject(DATABASE_HEALTH)
    private readonly databaseHealth: DatabaseHealthPort,
  ) {}

  async check(): Promise<HealthStatus> {
    let databaseUp: boolean;

    try {
      databaseUp = await this.databaseHealth.ping();
    } catch {
      databaseUp = false;
    }

    return {
      status: databaseUp ? 'ok' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: databaseUp ? 'up' : 'down',
    };
  }
}
