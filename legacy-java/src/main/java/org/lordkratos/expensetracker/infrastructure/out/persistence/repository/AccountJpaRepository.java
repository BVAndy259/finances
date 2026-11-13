package org.lordkratos.expensetracker.infrastructure.out.persistence.repository;

import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountJpaRepository extends JpaRepository<AccountEntity, Long> {
    List<AccountEntity> findByUserId(Long userId);
}