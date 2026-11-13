package org.lordkratos.expensetracker.infrastructure.out.persistence.mapper;

import org.lordkratos.expensetracker.domain.model.Transaction;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.AccountEntity;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.TransactionEntity;
import org.springframework.stereotype.Component;

@Component
public class TransactionMapper {

    public Transaction toDomain(TransactionEntity entity) {
        Transaction transaction = new Transaction();
        transaction.setId(entity.getId());
        transaction.setAccountId(entity.getAccount().getId());
        transaction.setTransactionType(entity.getTransactionType());
        transaction.setAmount(entity.getAmount());
        transaction.setDescription(entity.getDescription());
        transaction.setLocation(entity.getLocation());
        transaction.setTransactionDate(entity.getTransactionDate());
        return transaction;
    }

    public TransactionEntity toEntity(Transaction domain, AccountEntity accountRef) {
        TransactionEntity entity = new TransactionEntity();
        entity.setId(domain.getId());
        entity.setAccount(accountRef);
        entity.setTransactionType(domain.getTransactionType());
        entity.setAmount(domain.getAmount());
        entity.setDescription(domain.getDescription());
        entity.setLocation(domain.getLocation());
        entity.setTransactionDate(domain.getTransactionDate());
        return entity;
    }
}