package org.lordkratos.expensetracker.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PingController {
    @GetMapping("/")
    public String keepAlive() {
        return "El servidor del bot está despierto y funcionando.";
    }
}
