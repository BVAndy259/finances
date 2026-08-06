package org.lordkratos.expensetracker.infrastructure.out.persistence.repository;

import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.AppUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserJpaRepository extends JpaRepository<AppUserEntity, Long> {
    Optional<AppUserEntity> findByTelegramChatId(String telegramChatId);
}