package org.lordkratos.expensetracker.repository;

import org.lordkratos.expensetracker.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    // Buscar por Id de Cuenta
    List<Transaction> findByAccountId(Long accountId);
}
