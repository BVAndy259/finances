import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import Decimal from 'decimal.js';
import { AppUser, Transaction, TransactionType } from '@expense-tracker/core';
import { TransactionService } from '../../application/usecase/transaction.service';
import { CurrentUser } from '../../infrastructure/auth/current-user.decorator';
import {
  MoneyMovementDto,
  TransactionQueryDto,
  TransferDto,
} from './dto/transaction.dto';

interface TransactionResponse {
  id?: string;
  accountId: string;
  transactionType: TransactionType;
  amount: string;
  description: string;
  location: string;
  transactionDate: Date;
}

const DEFAULT_LOCATION = 'Web';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async list(
    @CurrentUser() user: AppUser,
    @Query() query: TransactionQueryDto,
  ): Promise<{
    items: TransactionResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const result = await this.transactionService.listTransactions(user, {
      accountId: query.accountId,
      type: query.type as TransactionType | undefined,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page,
      limit,
    });

    return {
      items: result.items.map((transaction) => this.toResponse(transaction)),
      total: result.total,
      page,
      limit,
    };
  }

  @Post('expense')
  async registerExpense(
    @CurrentUser() user: AppUser,
    @Body() dto: MoneyMovementDto,
  ): Promise<TransactionResponse> {
    const transaction = await this.transactionService.registerExpenseForUser(
      user,
      dto.accountId,
      new Decimal(dto.amount),
      dto.description,
      dto.location ?? DEFAULT_LOCATION,
    );
    return this.toResponse(transaction);
  }

  @Post('income')
  async registerIncome(
    @CurrentUser() user: AppUser,
    @Body() dto: MoneyMovementDto,
  ): Promise<TransactionResponse> {
    const transaction = await this.transactionService.registerIncomeForUser(
      user,
      dto.accountId,
      new Decimal(dto.amount),
      dto.description,
      dto.location ?? DEFAULT_LOCATION,
    );
    return this.toResponse(transaction);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.NO_CONTENT)
  async transfer(
    @CurrentUser() user: AppUser,
    @Body() dto: TransferDto,
  ): Promise<void> {
    await this.transactionService.transferForUser(
      user,
      dto.originAccountId,
      dto.destinationAccountId,
      new Decimal(dto.amount),
      dto.description,
      dto.location ?? DEFAULT_LOCATION,
    );
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AppUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TransactionResponse> {
    const transaction = await this.transactionService.getTransactionForUser(
      user,
      id,
    );
    return this.toResponse(transaction);
  }

  private toResponse(transaction: Transaction): TransactionResponse {
    return {
      id: transaction.id,
      accountId: transaction.accountId,
      transactionType: transaction.transactionType,
      amount: transaction.amount.toString(),
      description: transaction.description,
      location: transaction.location,
      transactionDate: transaction.transactionDate,
    };
  }
}
