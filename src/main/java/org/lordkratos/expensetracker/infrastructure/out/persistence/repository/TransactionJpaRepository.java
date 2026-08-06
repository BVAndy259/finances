package org.lordkratos.expensetracker.infrastructure.out.persistence.repository;

import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionJpaRepository extends JpaRepository<TransactionEntity, Long> {
    List<TransactionEntity> findByAccountId(Long accountId);
}