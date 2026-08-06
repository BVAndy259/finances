package org.lordkratos.expensetracker.domain.port.out;

import org.lordkratos.expensetracker.domain.model.AppUser;

import java.util.Optional;

public interface AppUserRepositoryPort {
    AppUser save(AppUser user);
    Optional<AppUser> findByTelegramChatId(String telegramChatId);
}