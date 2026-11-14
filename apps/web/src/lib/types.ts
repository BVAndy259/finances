export interface AuthUser {
  id?: string;
  email: string | null;
  telegramChatId: string | null;
  alias: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  alias?: string;
}

export interface AccountSummary {
  id?: string;
  name: string;
  balance: string;
  currency: string;
}

export interface TransactionSummary {
  id?: string;
  accountId: string;
  transactionType: string;
  amount: string;
  description: string;
  location: string;
  transactionDate: string;
}

export interface LoanSummary {
  id?: string;
  accountId: string;
  debtorName: string;
  amount: string;
  paidAmount: string;
  remainingAmount: string;
  dueDate: string | null;
  status: string;
  loanDate: string;
}

export interface DashboardSummary {
  month: string;
  totalBalance: string;
  income: string;
  expense: string;
  net: string;
  accounts: AccountSummary[];
  recentTransactions: TransactionSummary[];
  loans: {
    total: string;
    count: number;
    items: LoanSummary[];
  };
}
