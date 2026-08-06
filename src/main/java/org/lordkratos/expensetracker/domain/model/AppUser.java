package org.lordkratos.expensetracker.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AppUser {
    private Long id;
    private String telegramChatId;
    private String alias;
    private LocalDateTime createdAt = LocalDateTime.now();
}
