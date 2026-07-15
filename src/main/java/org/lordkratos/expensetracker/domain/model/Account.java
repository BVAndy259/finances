package org.lordkratos.expensetracker.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class Account {

    private Long id;
    private String name;
    private BigDecimal balance = BigDecimal.ZERO;
    private String currency = "PEN";
    private LocalDateTime createdAt = LocalDateTime.now();
}
