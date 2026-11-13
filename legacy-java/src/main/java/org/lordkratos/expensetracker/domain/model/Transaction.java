package org.lordkratos.expensetracker.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class Transaction {
    private Long id;
    private Long accountId;
    private String transactionType;
    private BigDecimal amount;
    private String description;
    private String location;
    private LocalDateTime transactionDate = LocalDateTime.now();
}