package org.lordkratos.expensetracker.domain.repository;

import org.lordkratos.expensetracker.domain.model.Account;

import java.util.Optional;

public interface AccountRepositoryPort {

    Optional<Account> findByName(String name);
    void save(Account account);
}
