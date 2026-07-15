package org.lordkratos.expensetracker.domain.port.out;

import org.lordkratos.expensetracker.domain.model.Account;

import java.util.Optional;

public interface AccountRepositoryPort {

    Account save(Account account);
    Optional<Account> findById(Long id);
    List<Account> findByUserId(Long userId);
}
