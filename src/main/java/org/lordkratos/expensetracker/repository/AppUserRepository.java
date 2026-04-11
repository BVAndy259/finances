package org.lordkratos.expensetracker.repository;

import org.lordkratos.expensetracker.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    // Buscar por Id del Chat de Telegram
    Optional<AppUser> findByTelegramChatId(String telegramChatId);
}
