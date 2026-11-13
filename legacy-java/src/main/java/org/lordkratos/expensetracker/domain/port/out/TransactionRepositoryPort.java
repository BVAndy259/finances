package org.lordkratos.expensetracker.domain.port.out;

import org.lordkratos.expensetracker.domain.model.Transaction;

import java.util.List;

public interface TransactionRepositoryPort {
    Transaction save(Transaction transaction);
    List<Transaction> findByAccountId(Long accountId);
}