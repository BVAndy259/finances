package org.lordkratos.expensetracker.application.usecase;

import lombok.RequiredArgsConstructor;
import org.lordkratos.expensetracker.domain.model.AppUser;
import org.lordkratos.expensetracker.domain.port.out.AppUserRepositoryPort;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AppUserService {

    private final AppUserRepositoryPort appUserRepositoryPort;

    public Optional<AppUser> getUserByTelegramId(String telegramChatId) {
        return appUserRepositoryPort.findByTelegramChatId(telegramChatId);
    }

    public AppUser registerUserIfNotExists(String telegramChatId, String alias) {
        Optional<AppUser> existingUser = getUserByTelegramId(telegramChatId);

        if (existingUser.isPresent()) {
            return existingUser.get();
        }

        AppUser newUser = new AppUser();
        newUser.setTelegramChatId(telegramChatId);
        newUser.setAlias(alias);
        return appUserRepositoryPort.save(newUser);
    }
}