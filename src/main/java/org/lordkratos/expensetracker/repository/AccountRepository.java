package org.lordkratos.expensetracker.repository;

import org.lordkratos.expensetracker.model.Account;
import org.lordkratos.expensetracker.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    // Buscar por Id de Usuario
    List<Account> findByUserId(Long userId);
    // Buscar por Nombre de Usuario
    List<Account> findByUser(AppUser user);
}
