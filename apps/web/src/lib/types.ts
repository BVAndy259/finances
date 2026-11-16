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

export interface UpdateCredentialsInput {
  currentPassword: string;
  email?: string;
  newPassword?: string;
}

export interface Account {
  id?: string;
  userId: string;
  name: string;
  balance: string;
  currency: string;
  createdAt: string;
}

export interface AccountInput {
  name: string;
  currency: string;
}

export interface AccountSummary {
  id?: string;
  name: string;
  balance: string;
  currency: string;
}

export interface Transaction {
  id?: string;
  accountId: string;
  transactionType: string;
  amount: string;
  description: string;
  location: string;
  transactionDate: string;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface MoneyMovementInput {
  accountId: string;
  amount: string;
  description: string;
  location?: string;
}

export interface TransferInput {
  originAccountId: string;
  destinationAccountId: string;
  amount: string;
  description: string;
  location?: string;
}

export interface TransactionFilters {
  accountId?: string;
  type?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

export interface Loan {
  id?: string;
  userId: string;
  accountId: string;
  debtorName: string;
  amount: string;
  paidAmount: string;
  remainingAmount: string;
  dueDate: string | null;
  status: string;
  loanDate: string;
}

export interface LoanInput {
  accountId: string;
  amount: string;
  debtorName: string;
  description: string;
  dueDate?: string;
}

export interface LoanPaymentInput {
  accountId: string;
  amount: string;
}

export interface DashboardSummary {
  month: string;
  totalBalance: string;
  income: string;
  expense: string;
  net: string;
  accounts: AccountSummary[];
  recentTransactions: Transaction[];
  loans: {
    total: string;
    count: number;
    items: Loan[];
  };
}
