package org.lordkratos.expensetracker.infrastructure.out.persistence.adapter;

import lombok.RequiredArgsConstructor;
import org.lordkratos.expensetracker.domain.model.Account;
import org.lordkratos.expensetracker.domain.port.out.AccountRepositoryPort;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.AccountEntity;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.AppUserEntity;
import org.lordkratos.expensetracker.infrastructure.out.persistence.mapper.AccountMapper;
import org.lordkratos.expensetracker.infrastructure.out.persistence.repository.AccountJpaRepository;
import org.lordkratos.expensetracker.infrastructure.out.persistence.repository.AppUserJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AccountRepositoryAdapter implements AccountRepositoryPort {

    private final AccountJpaRepository jpaRepository;
    private final AppUserJpaRepository appUserJpaRepository;
    private final AccountMapper mapper;

    @Override
    public Account save(Account account) {
        AppUserEntity userRef = appUserJpaRepository.getReferenceById(account.getUserId());
        AccountEntity saved = jpaRepository.save(mapper.toEntity(account, userRef));
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<Account> findById(Long id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Account> findByUserId(Long userId) {
        return jpaRepository.findByUserId(userId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }
}