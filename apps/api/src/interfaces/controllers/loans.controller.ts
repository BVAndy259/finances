import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import Decimal from 'decimal.js';
import { AppUser, Loan, LoanStatus } from '@expense-tracker/core';
import { LoanService } from '../../application/usecase/loan.service';
import { CurrentUser } from '../../infrastructure/auth/current-user.decorator';
import { CreateLoanDto, LoanQueryDto, PayLoanDto } from './dto/loan.dto';

interface LoanResponse {
  id?: string;
  userId: string;
  accountId: string;
  debtorName: string;
  amount: string;
  paidAmount: string;
  remainingAmount: string;
  dueDate: string | null;
  status: LoanStatus;
  loanDate: Date;
}

@Controller('loans')
export class LoansController {
  constructor(private readonly loanService: LoanService) {}

  @Get()
  async list(
    @CurrentUser() user: AppUser,
    @Query() query: LoanQueryDto,
  ): Promise<LoanResponse[]> {
    const loans = await this.loanService.listLoans(
      user,
      query.status as LoanStatus | undefined,
    );
    return loans.map((loan) => this.toResponse(loan));
  }

  @Post()
  async create(
    @CurrentUser() user: AppUser,
    @Body() dto: CreateLoanDto,
  ): Promise<LoanResponse> {
    const loan = await this.loanService.grantLoanForUser(
      user,
      dto.accountId,
      new Decimal(dto.amount),
      dto.debtorName,
      dto.description,
      dto.dueDate ?? null,
    );
    return this.toResponse(loan);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AppUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LoanResponse> {
    const loan = await this.loanService.getLoanForUser(user, id);
    return this.toResponse(loan);
  }

  @Post(':id/payments')
  async pay(
    @CurrentUser() user: AppUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayLoanDto,
  ): Promise<LoanResponse> {
    const loan = await this.loanService.payLoanForUser(
      user,
      id,
      dto.accountId,
      new Decimal(dto.amount),
    );
    return this.toResponse(loan);
  }

  private toResponse(loan: Loan): LoanResponse {
    return {
      id: loan.id,
      userId: loan.userId,
      accountId: loan.accountId,
      debtorName: loan.debtorName,
      amount: loan.amount.toString(),
      paidAmount: loan.paidAmount.toString(),
      remainingAmount: loan.remainingAmount.toString(),
      dueDate: loan.dueDate,
      status: loan.status,
      loanDate: loan.loanDate,
    };
  }
}
