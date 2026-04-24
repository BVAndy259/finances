package org.lordkratos.expensetracker.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "loan")
public class Loan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "debtor_name")
    private String debtorName;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "paid_amount", nullable = false, columnDefinition = "numeric(12,2) default 0")
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "status")
    private String status = "PENDIENTE";

    @Column(name = "created_at")
    private LocalDateTime loanDate = LocalDateTime.now();

    public BigDecimal getRemainingAmount() {
        return amount.subtract(paidAmount);
    }
}
