package org.lordkratos.expensetracker.infrastructure.out.persistence.mapper;

import org.lordkratos.expensetracker.domain.model.Loan;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.AccountEntity;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.AppUserEntity;
import org.lordkratos.expensetracker.infrastructure.out.persistence.entity.LoanEntity;
import org.springframework.stereotype.Component;

@Component
public class LoanMapper {

    public Loan toDomain(LoanEntity entity) {
        Loan loan = new Loan();
        loan.setId(entity.getId());
        loan.setUserId(entity.getUser().getId());
        loan.setAccountId(entity.getAccount().getId());
        loan.setDebtorName(entity.getDebtorName());
        loan.setAmount(entity.getAmount());
        loan.setPaidAmount(entity.getPaidAmount());
        loan.setDueDate(entity.getDueDate());
        loan.setStatus(entity.getStatus());
        loan.setLoanDate(entity.getLoanDate());
        return loan;
    }

    public LoanEntity toEntity(Loan domain, AppUserEntity userRef, AccountEntity accountRef) {
        LoanEntity entity = new LoanEntity();
        entity.setId(domain.getId());
        entity.setUser(userRef);
        entity.setAccount(accountRef);
        entity.setDebtorName(domain.getDebtorName());
        entity.setAmount(domain.getAmount());
        entity.setPaidAmount(domain.getPaidAmount());
        entity.setDueDate(domain.getDueDate());
        entity.setStatus(domain.getStatus());
        entity.setLoanDate(domain.getLoanDate());
        return entity;
    }
}