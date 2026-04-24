package org.lordkratos.expensetracker.repository;

import org.lordkratos.expensetracker.model.AppUser;
import org.lordkratos.expensetracker.model.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    // Buscar usuarios según número de estado diferente
    List<Loan> findByUserAndStatusNot(AppUser user, String status);
}
