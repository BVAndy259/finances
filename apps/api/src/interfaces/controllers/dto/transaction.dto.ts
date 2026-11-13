import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { TRANSACTION_TYPES } from '@expense-tracker/shared';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export class MoneyMovementDto {
  @IsUUID()
  accountId!: string;

  @IsString()
  @Matches(AMOUNT_PATTERN, {
    message: 'El monto debe tener hasta 2 decimales',
  })
  amount!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;
}

export class TransferDto {
  @IsUUID()
  originAccountId!: string;

  @IsUUID()
  destinationAccountId!: string;

  @IsString()
  @Matches(AMOUNT_PATTERN, {
    message: 'El monto debe tener hasta 2 decimales',
  })
  amount!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;
}

export class TransactionQueryDto {
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsIn([...TRANSACTION_TYPES])
  type?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
