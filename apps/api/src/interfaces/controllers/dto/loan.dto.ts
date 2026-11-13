import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LOAN_STATUSES } from '@expense-tracker/shared';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export class CreateLoanDto {
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
  debtorName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  description!: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class PayLoanDto {
  @IsUUID()
  accountId!: string;

  @IsString()
  @Matches(AMOUNT_PATTERN, {
    message: 'El monto debe tener hasta 2 decimales',
  })
  amount!: string;
}

export class LoanQueryDto {
  @IsOptional()
  @IsIn([...LOAN_STATUSES])
  status?: string;
}
