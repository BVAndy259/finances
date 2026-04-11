package org.lordkratos.expensetracker.service;

import lombok.RequiredArgsConstructor;
import org.lordkratos.expensetracker.model.Account;
import org.lordkratos.expensetracker.model.AppUser;
import org.lordkratos.expensetracker.repository.AccountRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {
    private final AccountRepository accountRepository;

    // Crear una nueva cuenta vacía
    public Account createdAccount(AppUser user, String accountName) {
        Account newAccount = new Account();
        newAccount.setUser(user);
        newAccount.setName(accountName);
        newAccount.setBalance(BigDecimal.ZERO); // Sin fondos
        return accountRepository.save(newAccount);
    }

    // Obtener cuentas del usuario
    public List<Account> getAccountsByUser(AppUser user) {
        return accountRepository.findByUser(user);
    }

    // Suma de patrimonio total
    public BigDecimal getTotalBalance(AppUser user) {
        List<Account> accounts = getAccountsByUser(user);
        return accounts.stream()
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
