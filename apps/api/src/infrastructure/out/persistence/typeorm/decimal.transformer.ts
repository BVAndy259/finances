import Decimal from 'decimal.js';
import { ValueTransformer } from 'typeorm';

export const decimalTransformer: ValueTransformer = {
  to(value?: Decimal | number | string | null): string | null | undefined {
    if (value === null || value === undefined) {
      return value;
    }
    return new Decimal(value).toString();
  },
  from(value?: string | number | null): Decimal | null {
    if (value === null || value === undefined) {
      return null;
    }
    return new Decimal(value);
  },
};
