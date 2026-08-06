package org.lordkratos.expensetracker.application.usecase;

import lombok.RequiredArgsConstructor;
import org.lordkratos.expensetracker.domain.model.Account;
import org.lordkratos.expensetracker.domain.model.AppUser;
import org.lordkratos.expensetracker.domain.port.out.AccountRepositoryPort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepositoryPort accountRepositoryPort;

    public Account createdAccount(AppUser user, String accountName) {
        Account newAccount = new Account();
        newAccount.setUserId(user.getId());
        newAccount.setName(accountName);
        newAccount.setBalance(BigDecimal.ZERO);
        return accountRepositoryPort.save(newAccount);
    }

    public List<Account> getAccountsByUser(AppUser user) {
        return accountRepositoryPort.findByUserId(user.getId());
    }

    public BigDecimal getTotalBalance(AppUser user) {
        return getAccountsByUser(user).stream()
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}