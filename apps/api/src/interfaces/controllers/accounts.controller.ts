import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Account, AppUser } from '@expense-tracker/core';
import { AccountService } from '../../application/usecase/account.service';
import { CurrentUser } from '../../infrastructure/auth/current-user.decorator';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

interface AccountResponse {
  id?: string;
  userId: string;
  name: string;
  balance: string;
  currency: string;
  createdAt: Date;
}

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  async list(@CurrentUser() user: AppUser): Promise<AccountResponse[]> {
    const accounts = await this.accountService.getAccountsByUser(user);
    return accounts.map((account) => this.toResponse(account));
  }

  @Post()
  async create(
    @CurrentUser() user: AppUser,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountResponse> {
    const account = await this.accountService.createAccount(
      user,
      dto.name,
      dto.currency,
    );
    return this.toResponse(account);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AppUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AccountResponse> {
    const account = await this.accountService.getAccountForUser(user, id);
    return this.toResponse(account);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AppUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountResponse> {
    const account = await this.accountService.updateAccount(user, id, dto);
    return this.toResponse(account);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: AppUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.accountService.deleteAccount(user, id);
  }

  private toResponse(account: Account): AccountResponse {
    return {
      id: account.id,
      userId: account.userId,
      name: account.name,
      balance: account.balance.toString(),
      currency: account.currency,
      createdAt: account.createdAt,
    };
  }
}
