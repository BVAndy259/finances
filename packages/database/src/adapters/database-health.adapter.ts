import { Injectable } from '@nestjs/common';
import { DatabaseHealthPort } from '@expense-tracker/core';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthAdapter implements DatabaseHealthPort {
  constructor(private readonly dataSource: DataSource) {}

  async ping(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
