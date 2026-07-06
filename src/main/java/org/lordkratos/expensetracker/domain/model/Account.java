package org.lordkratos.expensetracker.domain.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@AllArgsConstructor
@Getter
public class Account {

    private Long id;
    private String name;
    private BigDecimal balance = BigDecimal.ZERO;
    private String currency;

    public void debit(BigDecimal amount) {
        if (amount.compareTo(this.balance) > 0) {
            throw new RuntimeException("Insufficient balance");
        }
        this.balance = this.balance.subtract(amount);
    }
}
