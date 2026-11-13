package org.lordkratos.expensetracker.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class Loan {
    private Long id;
    private Long userId;
    private Long accountId;
    private String debtorName;
    private BigDecimal amount;
    private BigDecimal paidAmount = BigDecimal.ZERO;
    private LocalDate dueDate;
    private String status = "PENDIENTE";
    private LocalDateTime loanDate = LocalDateTime.now();

    public BigDecimal getRemainingAmount() {
        BigDecimal safeAmount = (amount != null) ? amount : BigDecimal.ZERO;
        BigDecimal safePaidAmount = (paidAmount != null) ? paidAmount : BigDecimal.ZERO;
        return safeAmount.subtract(safePaidAmount);
    }
}