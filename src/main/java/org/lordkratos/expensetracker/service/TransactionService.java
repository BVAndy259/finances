package org.lordkratos.expensetracker.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.lordkratos.expensetracker.model.Account;
import org.lordkratos.expensetracker.model.Transaction;
import org.lordkratos.expensetracker.repository.AccountRepository;
import org.lordkratos.expensetracker.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    // Registrar gasto
    @Transactional
    public Transaction registerExpense(Account account, BigDecimal amount, String description, String location) {
        // Valida si existe saldo disponible
        if (account.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Saldo insuficiente en la cuenta: " + account.getName());
        }

        // Resta saldo
        account.setBalance(account.getBalance().subtract(amount));
        accountRepository.save(account);

        // Registra gasto en la DB
        Transaction expense = new Transaction();
        expense.setAccount(account);
        expense.setTransactionType("EGRESO");
        expense.setAmount(amount);
        expense.setDescription(description);
        expense.setLocation(location);
        return transactionRepository.save(expense);
    }

    // Registrar ingresos
    @Transactional
    public Transaction registerIncome(Account account, BigDecimal amount, String description, String location) {
        // Sumar dinero
        account.setBalance(account.getBalance().add(amount));
        accountRepository.save(account);

        // Registra ingreso en la DB
        Transaction income = new Transaction();
        income.setAccount(account);
        income.setTransactionType("INGRESO");
        income.setAmount(amount);
        income.setDescription(description);
        income.setLocation(location);
        return transactionRepository.save(income);
    }
}