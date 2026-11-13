package org.lordkratos.expensetracker.infrastructure.out.persistence.mapper;

import org.lordkratos.expensetracker.domain.model.Account;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.AccountEntity;

import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.AppUserEntity;
import org.springframework.stereotype.Component;

@Component
public class AccountMapper {

    public Account toDomain(AccountEntity entity) {
        Account account = new Account();
        account.setId(entity.getId());
        account.setUserId(entity.getUser().getId());
        account.setName(entity.getName());
        account.setBalance(entity.getBalance());
        account.setCurrency(entity.getCurrency());
        account.setCreatedAt(entity.getCreatedAt());
        return account;
    }

    public AccountEntity toEntity(Account domain, AppUserEntity userRef) {
        AccountEntity entity = new AccountEntity();
        entity.setId(domain.getId());
        entity.setUser(userRef);
        entity.setName(domain.getName());
        entity.setBalance(domain.getBalance());
        entity.setCurrency(domain.getCurrency());
        entity.setCreatedAt(domain.getCreatedAt());
        return entity;
    }
}