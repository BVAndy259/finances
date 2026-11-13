import { IsOptional, Matches } from 'class-validator';

export class DashboardQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'El mes debe tener el formato YYYY-MM (Ej: 2026-11)',
  })
  month?: string;
}
