package org.lordkratos.expensetracker.service;

import lombok.RequiredArgsConstructor;
import org.lordkratos.expensetracker.model.AppUser;
import org.lordkratos.expensetracker.repository.AppUserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AppUserService {
    private final AppUserRepository appUserRepository;

    // Buscar a un usuario por su Chat ID de Telegram
    public Optional<AppUser> getUserByTelegramId(String telegramChadId) {
        return appUserRepository.findByTelegramChatId(telegramChadId);
    }

    // Registrar a la familiar
    public AppUser registerUserIfNotExists(String telegramChatId, String alias) {
        Optional<AppUser> existingUser = getUserByTelegramId(telegramChatId);

        if (existingUser.isPresent()) {
            return existingUser.get(); // Devuelve si ya existe
        }

        // Guarda usuario si escribe por primera vez
        AppUser newUser = new AppUser();
        newUser.setTelegramChatId(telegramChatId);
        newUser.setAlias(alias);
        return appUserRepository.save(newUser);
    }
}
