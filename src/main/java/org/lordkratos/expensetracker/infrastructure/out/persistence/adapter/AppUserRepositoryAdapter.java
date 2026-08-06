package org.lordkratos.expensetracker.infrastructure.out.persistence.adapter;

import lombok.RequiredArgsConstructor;
import org.lordkratos.expensetracker.domain.model.AppUser;
import org.lordkratos.expensetracker.domain.port.out.AppUserRepositoryPort;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.AppUserEntity;
import org.lordkratos.expensetracker.infrastructure.out.persistence.mapper.AppUserMapper;
import org.lordkratos.expensetracker.infrastructure.out.persistence.repository.AppUserJpaRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AppUserRepositoryAdapter implements AppUserRepositoryPort {

    private final AppUserJpaRepository jpaRepository;
    private final AppUserMapper mapper;

    @Override
    public AppUser save(AppUser user) {
        AppUserEntity saved = jpaRepository.save(mapper.toEntity(user));
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<AppUser> findByTelegramChatId(String telegramChatId) {
        return jpaRepository.findByTelegramChatId(telegramChatId).map(mapper::toDomain);
    }
}