package org.lordkratos.expensetracker.infrastructure.persistence;

import org.lordkratos.expensetracker.domain.model.Account;
import org.lordkratos.expensetracker.domain.repository.AccountRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AccountRepositoryAdapter implements AccountRepositoryPort {

    private final AccountRepositoryPort repository;

    public AccountRepositoryAdapter(AccountRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public Optional<Account> findByName(String name) {
        return repository.findByName(name).map(e ->
                new Account(e.getId(), e.getName(), e.getBalance(), e.getCurrency()));
    }

    @Override
    public void save(Account account) {
        AccountEntity entity = new AccountEntity(account.getId(), account.getName(), account.getBalance(), account.getCurrency());
        repository.save(entity);
    }
}
