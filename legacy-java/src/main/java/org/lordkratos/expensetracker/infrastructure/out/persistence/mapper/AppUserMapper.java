package org.lordkratos.expensetracker.infrastructure.out.persistence.mapper;

import org.lordkratos.expensetracker.domain.model.AppUser;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.AppUserEntity;
import org.springframework.stereotype.Component;

@Component
public class AppUserMapper {

    public AppUser toDomain(AppUserEntity entity) {
        AppUser user = new AppUser();
        user.setId(entity.getId());
        user.setTelegramChatId(entity.getTelegramChatId());
        user.setAlias(entity.getAlias());
        user.setCreatedAt(entity.getCreatedAt());
        return user;
    }

    public AppUserEntity toEntity(AppUser domain) {
        AppUserEntity entity = new AppUserEntity();
        entity.setId(domain.getId());
        entity.setTelegramChatId(domain.getTelegramChatId());
        entity.setAlias(domain.getAlias());
        entity.setCreatedAt(domain.getCreatedAt());
        return entity;
    }
}