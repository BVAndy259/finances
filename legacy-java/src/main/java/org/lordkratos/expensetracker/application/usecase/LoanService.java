package org.lordkratos.expensetracker.application.usecase;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.lordkratos.expensetracker.domain.model.Account;
import org.lordkratos.expensetracker.domain.model.AppUser;
import org.lordkratos.expensetracker.domain.model.Loan;
import org.lordkratos.expensetracker.domain.model.Transaction;
import org.lordkratos.expensetracker.domain.port.out.AccountRepositoryPort;
import org.lordkratos.expensetracker.domain.port.out.LoanRepositoryPort;
import org.lordkratos.expensetracker.domain.port.out.TransactionRepositoryPort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepositoryPort loanRepositoryPort;
    private final AccountRepositoryPort accountRepositoryPort;
    private final TransactionRepositoryPort transactionRepositoryPort;

    @Transactional
    public Loan grantLoan(Account originAccount, BigDecimal amount, String debtorName, String description, LocalDate dueDate) {
        if (originAccount.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Saldo insuficiente en la cuenta: " + originAccount.getName());
        }

        originAccount.setBalance(originAccount.getBalance().subtract(amount));
        accountRepositoryPort.save(originAccount);

        Transaction out = new Transaction();
        out.setAccountId(originAccount.getId());
        out.setTransactionType("EGRESO_PRESTAMO");
        out.setAmount(amount);
        out.setDescription("Préstamo a " + debtorName + ": " + description);
        out.setLocation("Bot");
        transactionRepositoryPort.save(out);

        Loan loan = new Loan();
        loan.setUserId(originAccount.getUserId());
        loan.setAccountId(originAccount.getId());
        loan.setDebtorName(debtorName);
        loan.setAmount(amount);
        loan.setDueDate(dueDate);
        return loanRepositoryPort.save(loan);
    }

    @Transactional
    public Loan payLoan(Long loanId, Account destinationAccount, BigDecimal paymentAmount) {
        Loan loan = loanRepositoryPort.findById(loanId).orElseThrow(() -> new RuntimeException("Préstamo no encontrado"));

        if (loan.getStatus().equals("PAGADO")) {
            throw new RuntimeException("Este préstam ya fue pagado");
        }

        BigDecimal remaining = loan.getRemainingAmount();
        if (paymentAmount.compareTo(remaining) > 0) {
            throw new RuntimeException("El monto a cobrar (S/" + paymentAmount + ") es mayor a la deuda actual (S/" + remaining + ")");
        }

        destinationAccount.setBalance(destinationAccount.getBalance().add(loan.getAmount()));
        accountRepositoryPort.save(destinationAccount);

        Transaction in = new Transaction();
        in.setAccountId(destinationAccount.getId());
        in.setTransactionType("INGRESO_COBRO");
        in.setAmount(paymentAmount);
        in.setDescription("Cobro de préstamo a " + loan.getDebtorName());
        in.setLocation("Bot");
        transactionRepositoryPort.save(in);

        BigDecimal newPaidAmount = loan.getPaidAmount().add(paymentAmount);
        loan.setPaidAmount(newPaidAmount);

        if (newPaidAmount.compareTo(loan.getAmount()) >= 0) {
            loan.setStatus("PAGADO");
        } else {
            loan.setStatus("PAGO_PARCIAL");
        }

        return loanRepositoryPort.save(loan);
    }

    public List<Loan> getPendingLoans(AppUser user) {
        List<String> activeStatuses = List.of("PENDIENTE", "PAGO_PARCIAL");
        return loanRepositoryPort.findByUserIdAndStatusIn(user.getId(), activeStatuses);
    }
}