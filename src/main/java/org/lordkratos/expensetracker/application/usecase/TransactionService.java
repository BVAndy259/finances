package org.lordkratos.expensetracker.application.usecase;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.lordkratos.expensetracker.domain.model.Account;
import org.lordkratos.expensetracker.domain.model.Transaction;
import org.lordkratos.expensetracker.domain.port.out.AccountRepositoryPort;
import org.lordkratos.expensetracker.domain.port.out.TransactionRepositoryPort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepositoryPort transactionRepositoryPort;
    private final AccountRepositoryPort accountRepositoryPort;

    @Transactional
    public Transaction registerExpense(Account account, BigDecimal amount, String description, String location) {
        if (account.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Saldo insuficiente en la cuenta: " + account.getName());
        }
        account.setBalance(account.getBalance().subtract(amount));
        accountRepositoryPort.save(account);

        Transaction expense = new Transaction();
        expense.setAccountId(account.getId());
        expense.setTransactionType("EGRESO");
        expense.setAmount(amount);
        expense.setDescription(description);
        expense.setLocation(location);
        return transactionRepositoryPort.save(expense);
    }

    @Transactional
    public Transaction registerIncome(Account account, BigDecimal amount, String description, String location) {
        account.setBalance(account.getBalance().add(amount));
        accountRepositoryPort.save(account);

        Transaction income = new Transaction();
        income.setAccountId(account.getId());
        income.setTransactionType("INGRESO");
        income.setAmount(amount);
        income.setDescription(description);
        income.setLocation(location);
        return transactionRepositoryPort.save(income);
    }

    @Transactional
    public void transfer(Account originAccount, Account destinationAccount, BigDecimal amount, String description, String location) {
        if (originAccount.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Saldo insuficiente en la cuenta origen: " + originAccount.getName());
        }

        originAccount.setBalance(originAccount.getBalance().subtract(amount));
        accountRepositoryPort.save(originAccount);

        destinationAccount.setBalance(destinationAccount.getBalance().add(amount));
        accountRepositoryPort.save(destinationAccount);

        Transaction out = new Transaction();
        out.setAccountId(originAccount.getId());
        out.setTransactionType("TRANSFERENCIA_SALIDA");
        out.setAmount(amount);
        out.setDescription("A " + destinationAccount.getName() + ": " + description);
        out.setLocation(location);
        transactionRepositoryPort.save(out);

        Transaction in = new Transaction();
        in.setAccountId(destinationAccount.getId());
        in.setTransactionType("TRANSFERENCIA_ENTRADA");
        in.setAmount(amount);
        in.setDescription("De " + originAccount.getName() + ": " + description);
        in.setLocation(location);
        transactionRepositoryPort.save(in);
    }
}