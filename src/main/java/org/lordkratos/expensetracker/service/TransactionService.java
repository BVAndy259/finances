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

    @Transactional
    public void transfer(Account originAccount, Account destinationAccount, BigDecimal amount, String description, String location) {
        // Verificar fondos en la cuenta origen
        if (originAccount.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Saldo insuficiente en la cuenta origen: " + originAccount.getName());
        }

        // Resta en cuenta origen
        originAccount.setBalance(originAccount.getBalance().subtract(amount));
        accountRepository.save(originAccount);

        // Sumar en cuenta destino
        destinationAccount.setBalance(destinationAccount.getBalance().add(amount));
        accountRepository.save(destinationAccount);

        // Registrar en historial
        Transaction out = new Transaction();
        out.setAccount(originAccount);
        out.setTransactionType("TRANSFERENCIA_SALIDA");
        out.setAmount(amount);
        out.setDescription("A " + destinationAccount.getName() + ": " + description);
        out.setLocation(location);
        transactionRepository.save(out);

        Transaction in = new Transaction();
        in.setAccount(destinationAccount);
        in.setTransactionType("TRANSFERENCIA_ENTRADA");
        in.setAmount(amount);
        in.setDescription("De " + originAccount.getName() + ": " + description);
        in.setLocation(location);
        transactionRepository.save(in);
    }
}