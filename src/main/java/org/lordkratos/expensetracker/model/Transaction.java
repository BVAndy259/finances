package org.lordkratos.expensetracker.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "transaction")
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "transaction_type")
    private String transactionType;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "description")
    private String description;

    @Column(name = "location")
    private String location;

    @Column(name = "transaction_date")
    private LocalDateTime transactionDate = LocalDateTime.now();
}
