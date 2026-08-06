package org.lordkratos.expensetracker.infrastructure.out.persistence.adapter;

import lombok.RequiredArgsConstructor;
import org.lordkratos.expensetracker.domain.model.Transaction;
import org.lordkratos.expensetracker.domain.port.out.TransactionRepositoryPort;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.AccountEntity;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.TransactionEntity;
import org.lordkratos.expensetracker.infrastructure.out.persistence.mapper.TransactionMapper;
import org.lordkratos.expensetracker.infrastructure.out.persistence.repository.AccountJpaRepository;
import org.lordkratos.expensetracker.infrastructure.out.persistence.repository.TransactionJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TransactionRepositoryAdapter implements TransactionRepositoryPort {

    private final TransactionJpaRepository jpaRepository;
    private final AccountJpaRepository accountJpaRepository;
    private final TransactionMapper mapper;

    @Override
    public Transaction save(Transaction transaction) {
        AccountEntity accountRef = accountJpaRepository.getReferenceById(transaction.getAccountId());
        TransactionEntity saved = jpaRepository.save(mapper.toEntity(transaction, accountRef));
        return mapper.toDomain(saved);
    }

    @Override
    public List<Transaction> findByAccountId(Long accountId) {
        return jpaRepository.findByAccountId(accountId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }
}