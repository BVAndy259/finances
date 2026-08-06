package org.lordkratos.expensetracker.infrastructure.out.persistence.repository;

import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.LoanEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanJpaRepository extends JpaRepository<LoanEntity, Long> {
    List<LoanEntity> findByUserIdAndStatusIn(Long userId, List<String> statuses);
}