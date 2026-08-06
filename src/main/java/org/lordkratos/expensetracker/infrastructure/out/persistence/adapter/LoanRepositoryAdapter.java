package org.lordkratos.expensetracker.infrastructure.out.persistence.adapter;

import lombok.RequiredArgsConstructor;
import org.lordkratos.expensetracker.domain.model.Loan;
import org.lordkratos.expensetracker.domain.port.out.LoanRepositoryPort;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.AccountEntity;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.AppUserEntity;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.LoanEntity;
import org.lordkratos.expensetracker.infrastructure.out.persistence.mapper.LoanMapper;
import org.lordkratos.expensetracker.infrastructure.out.persistence.repository.AccountJpaRepository;
import org.lordkratos.expensetracker.infrastructure.out.persistence.repository.AppUserJpaRepository;
import org.lordkratos.expensetracker.infrastructure.out.persistence.repository.LoanJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class LoanRepositoryAdapter implements LoanRepositoryPort {

    private final LoanJpaRepository jpaRepository;
    private final AppUserJpaRepository appUserJpaRepository;
    private final AccountJpaRepository accountJpaRepository;
    private final LoanMapper mapper;

    @Override
    public Loan save(Loan loan) {
        AppUserEntity userRef = appUserJpaRepository.getReferenceById(loan.getUserId());
        AccountEntity accountRef = accountJpaRepository.getReferenceById(loan.getAccountId());
        LoanEntity saved = jpaRepository.save(mapper.toEntity(loan, userRef, accountRef));
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<Loan> findById(Long id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Loan> findByUserIdAndStatusIn(Long userId, List<String> statuses) {
        return jpaRepository.findByUserIdAndStatusIn(userId, statuses).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }
}