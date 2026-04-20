package org.lordkratos.expensetracker.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.lordkratos.expensetracker.model.Account;
import org.lordkratos.expensetracker.model.AppUser;
import org.lordkratos.expensetracker.model.Loan;
import org.lordkratos.expensetracker.model.Transaction;
import org.lordkratos.expensetracker.repository.AccountRepository;
import org.lordkratos.expensetracker.repository.LoanRepository;
import org.lordkratos.expensetracker.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    // Prestar Dinero
    @Transactional
    public Loan grantLoan(Account originAccount, BigDecimal amount, String debtorName, String description) {
        // Verifica si hay fondos en las cuenta seleccionada
        if (originAccount.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Saldo insuficiente en la cuenta: " + originAccount.getName());
        }

        // Restar dinero
        originAccount.setBalance(originAccount.getBalance().subtract(amount));
        accountRepository.save(originAccount);

        // Registrar en historial de Transacciones
        Transaction out = new Transaction();
        out.setAccount(originAccount);
        out.setTransactionType("EGRESO_PRESTAMO");
        out.setAmount(amount);
        out.setDescription("Préstamo a " + debtorName + ": " + description);
        out.setLocation("Bot");
        transactionRepository.save(out);

        // Guardar préstamo
        Loan loan = new Loan();
        loan.setUser(originAccount.getUser());
        loan.setAccount(originAccount);
        loan.setDebtorName(debtorName);
        loan.setAmount(amount);
        return loanRepository.save(loan);
    }

    // Cobrar Dinero
    @Transactional
    public Loan payLoan(Long loanId, Account destinationAccount) {
        // Buscar el prestamo
        Loan loan = loanRepository.findById(loanId).orElseThrow(() -> new RuntimeException("Préstamo no encontrado"));

        // Verifica si el préstamo ya fue pagado
        if (loan.getStatus().equals("PAGADO")) {
            throw new RuntimeException("Este préstam ya fue pagado");
        }

        // Sumar dinero a la cuenta seleccionada
        destinationAccount.setBalance(destinationAccount.getBalance().add(loan.getAmount()));
        accountRepository.save(destinationAccount);

        // Registrar en historial de Transacciones
        Transaction in = new Transaction();
        in.setAccount(destinationAccount);
        in.setTransactionType("INGRESO_COBRO");
        in.setAmount(loan.getAmount());
        in.setDescription("Cobro de préstamo a " + loan.getDebtorName());
        in.setLocation("Bot");
        transactionRepository.save(in);

        // Actualizar estado de préstamo
        loan.setStatus("PAGADO");
        return loanRepository.save(loan);
    }

    // Buscar préstamos pendientes
    public List<Loan> getPendingLoans(AppUser user) {
        return loanRepository.findByUserAndStatus(user, "PENDIENTE");
    }
}
