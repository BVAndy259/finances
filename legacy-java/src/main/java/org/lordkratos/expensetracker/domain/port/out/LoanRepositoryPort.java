package org.lordkratos.expensetracker.domain.port.out;

import org.lordkratos.expensetracker.domain.model.Loan;

import java.util.List;
import java.util.Optional;

public interface LoanRepositoryPort {
    Loan save(Loan loan);
    Optional<Loan> findById(Long id);
    List<Loan> findByUserIdAndStatusIn(Long userId, List<String> statuses);
}