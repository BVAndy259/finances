package org.lordkratos.expensetracker.bot;

import org.lordkratos.expensetracker.model.Account;
import org.lordkratos.expensetracker.model.AppUser;
import org.lordkratos.expensetracker.model.Loan;
import org.lordkratos.expensetracker.service.AccountService;
import org.lordkratos.expensetracker.service.AppUserService;
import org.lordkratos.expensetracker.service.LoanService;
import org.lordkratos.expensetracker.service.TransactionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardRemove;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ExpenseTrackerBot extends TelegramLongPollingBot {

    private final AppUserService appUserService;
    private final AccountService accountService;
    private final TransactionService transactionService;
    private final LoanService loanService;

    private final Map<String, String> userStates = new ConcurrentHashMap<>();
    private final Map<String, BigDecimal> tempAmounts = new ConcurrentHashMap<>();
    private final Map<String, String> tempAccounts = new ConcurrentHashMap<>();

    public ExpenseTrackerBot(@Value("${telegram.bot.token}") String botToken,
                             AppUserService appUserService,
                             AccountService accountService,
                             TransactionService transactionService,
                             LoanService loanService) {
        super(botToken);
        this.appUserService = appUserService;
        this.accountService = accountService;
        this.transactionService = transactionService;
        this.loanService = loanService;
    }

    @Override
    public String getBotUsername() {
        return "kratos_finanzas_bot";
    }

    @Override
    public void onUpdateReceived(Update update) {
        if (update.hasMessage() && update.getMessage().hasText()) {
            String messageText = update.getMessage().getText().trim();
            String chatId = update.getMessage().getChatId().toString();
            String userFirstName = update.getMessage().getFrom().getFirstName();

            if (messageText.equalsIgnoreCase("/cancelar")) {
                clearStates(chatId);
                sendMessageAndRemoveKeyboard(chatId, "Operación cancelada. Escribe /comandos para ver las opciones.");
                return;
            }

            if (userStates.containsKey(chatId)) {
                String currentState = userStates.get(chatId);
                AppUser user = appUserService.getUserByTelegramId(chatId).get();

                if (currentState.equals("ESPERANDO_NOMBRE_CUENTA")) {
                    accountService.createdAccount(user, messageText);
                    clearStates(chatId);
                    sendMessage(chatId, "¡Cuenta '" + messageText + "' creada con éxito!");
                    return;
                }

                if (currentState.equals("ESPERANDO_CUENTA_GASTO") || currentState.equals("ESPERANDO_CUENTA_INGRESO") || currentState.equals("ESPERANDO_CUENTA_PRESTAMO")) {
                    boolean accountExists = accountService.getAccountsByUser(user).stream()
                            .anyMatch(a -> a.getName().equalsIgnoreCase(messageText));

                    if (!accountExists) {
                        sendMessage(chatId, "Esa cuenta no existe. Escribe un nombre válido o usa /cancelar.");
                        return;
                    }

                    String exactAccountName = accountService.getAccountsByUser(user).stream()
                            .filter(a -> a.getName().equalsIgnoreCase(messageText))
                            .findFirst().get().getName();

                    tempAccounts.put(chatId, exactAccountName);

                    if (currentState.equals("ESPERANDO_CUENTA_GASTO")) {
                        userStates.put(chatId, "ESPERANDO_MONTO_GASTO");
                        sendMessage(chatId, "Has seleccionado: " + exactAccountName + "\n¿Cuánto gastaste? (Ej: 15.50)");
                    } else if (currentState.equals("ESPERANDO_CUENTA_INGRESO")) {
                        userStates.put(chatId, "ESPERANDO_MONTO_INGRESO");
                        sendMessage(chatId, "Has seleccionado: " + exactAccountName + "\n¿Cuánto ingresó? (Ej: 50.00)");
                    } else if (currentState.equals("ESPERANDO_CUENTA_PRESTAMO")) {
                        userStates.put(chatId, "ESPERANDO_MONTO_PRESTAMO");
                        sendMessage(chatId, "¿Cuánto vas a prestar de " + exactAccountName + "? (Ej: 30.00)");
                    }
                    return;
                }

                else if (currentState.equals("ESPERANDO_CUENTA_ORIGEN_TRANSF") || currentState.equals("ESPERANDO_CUENTA_DESTINO_TRANSF")) {
                    boolean accountExists = accountService.getAccountsByUser(user).stream()
                            .anyMatch(a -> a.getName().equalsIgnoreCase(messageText));

                    if (!accountExists) {
                        sendMessage(chatId, "Esa cuenta no existe. Escribe un nombre válido o usa /cancelar.");
                        return;
                    }

                    String exactAccountName = accountService.getAccountsByUser(user).stream()
                            .filter(a -> a.getName().equalsIgnoreCase(messageText))
                            .findFirst().get().getName();

                    if (currentState.equals("ESPERANDO_CUENTA_ORIGEN_TRANSF")) {
                        tempAccounts.put(chatId + "_ORIGEN", exactAccountName);
                        userStates.put(chatId, "ESPERANDO_CUENTA_DESTINO_TRANSF");
                        sendAccountListPrompt(chatId, accountService.getAccountsByUser(user), "¿A qué cuenta irá el dinero? (DESTINO)");
                    } else {
                        if (exactAccountName.equals(tempAccounts.get(chatId + "_ORIGEN"))) {
                            sendMessage(chatId, "No puedes transferir a la misma cuenta de origen. Escribe otra cuenta destino:");
                            return;
                        }
                        tempAccounts.put(chatId + "_DESTINO", exactAccountName);
                        userStates.put(chatId, "ESPERANDO_MONTO_TRANSF");
                        String origen = tempAccounts.get(chatId + "_ORIGEN");
                        sendMessage(chatId, "Moviendo de " + origen + " a " + exactAccountName + "\n¿Cuánto vas a transferir? (Ej: 100.00)");
                    }
                    return;
                }

                else if (currentState.equals("ESPERANDO_MONTO_GASTO") ||
                        currentState.equals("ESPERANDO_MONTO_INGRESO") ||
                        currentState.equals("ESPERANDO_MONTO_TRANSF") ||
                        currentState.equals("ESPERANDO_MONTO_PRESTAMO")) {
                    try {
                        BigDecimal amount = new BigDecimal(messageText);
                        tempAmounts.put(chatId, amount);

                        if (currentState.equals("ESPERANDO_MONTO_GASTO")) {
                            userStates.put(chatId, "ESPERANDO_DESC_GASTO");
                            sendMessage(chatId, "Monto: S/" + amount + "\n¿En qué lo gastaste?");
                        } else if (currentState.equals("ESPERANDO_MONTO_INGRESO")) {
                            userStates.put(chatId, "ESPERANDO_DESC_INGRESO");
                            sendMessage(chatId, "Monto: S/" + amount + "\n¿De dónde proviene?");
                        } else if (currentState.equals("ESPERANDO_MONTO_TRANSF")) {
                            userStates.put(chatId, "ESPERANDO_DESC_TRANSF");
                            sendMessage(chatId, "Monto: S/" + amount + "\n¿Motivo de la transferencia?");
                        } else if (currentState.equals("ESPERANDO_MONTO_PRESTAMO")) {
                            userStates.put(chatId, "ESPERANDO_DEUDOR_PRESTAMO");
                            sendMessage(chatId, "Monto: S/" + amount + "\n¿A quién le prestas el dinero? (Ej: Juan)");
                        }
                    } catch (NumberFormatException e) {
                        sendMessage(chatId, "Por favor, ingresa solo números (Ej: 20.00).");
                    }
                    return;
                }

                else if (currentState.equals("ESPERANDO_DEUDOR_PRESTAMO")) {
                    tempAccounts.put(chatId + "_DEUDOR", messageText);
                    userStates.put(chatId, "ESPERANDO_DESC_PRESTAMO");
                    sendMessage(chatId, "¿Motivo del préstamo? (Ej: Para el taxi)");
                    return;
                }

                else if (currentState.equals("ESPERANDO_DESC_GASTO") ||
                        currentState.equals("ESPERANDO_DESC_INGRESO") ||
                        currentState.equals("ESPERANDO_DESC_TRANSF") ||
                        currentState.equals("ESPERANDO_DESC_PRESTAMO")) {

                    BigDecimal amount = tempAmounts.get(chatId);

                    try {
                        if (currentState.equals("ESPERANDO_DESC_GASTO") || currentState.equals("ESPERANDO_DESC_INGRESO") || currentState.equals("ESPERANDO_DESC_PRESTAMO")) {
                            String accountName = tempAccounts.get(chatId);
                            Account selectedAccount = accountService.getAccountsByUser(user).stream()
                                    .filter(a -> a.getName().equals(accountName))
                                    .findFirst().get();

                            if (currentState.equals("ESPERANDO_DESC_GASTO")) {
                                transactionService.registerExpense(selectedAccount, amount, messageText, "Bot");
                                sendMessage(chatId, "Gasto de S/" + amount + " registrado.");
                            } else if (currentState.equals("ESPERANDO_DESC_INGRESO")) {
                                transactionService.registerIncome(selectedAccount, amount, messageText, "Bot");
                                sendMessage(chatId, "Ingreso de S/" + amount + " registrado.");
                            } else if (currentState.equals("ESPERANDO_DESC_PRESTAMO")) {
                                String debtor = tempAccounts.get(chatId + "_DEUDOR");
                                loanService.grantLoan(selectedAccount, amount, debtor, messageText);
                                sendMessage(chatId, "Prestaste S/" + amount + " a " + debtor + ". ¡Guardado en pendientes!");
                            }
                        }
                        else if (currentState.equals("ESPERANDO_DESC_TRANSF")) {
                            Account origin = accountService.getAccountsByUser(user).stream()
                                    .filter(a -> a.getName().equals(tempAccounts.get(chatId + "_ORIGEN")))
                                    .findFirst().get();
                            Account dest = accountService.getAccountsByUser(user).stream()
                                    .filter(a -> a.getName().equals(tempAccounts.get(chatId + "_DESTINO")))
                                    .findFirst().get();

                            transactionService.transfer(origin, dest, amount, messageText, "Bot");
                            sendMessage(chatId, "Transferencia completada.");
                        }
                    } catch (RuntimeException e) {
                        sendMessage(chatId, "Error: " + e.getMessage());
                    } finally {
                        clearStates(chatId);
                    }
                    return;
                }

                else if (currentState.equals("ESPERANDO_ID_PRESTAMO")) {
                    try {
                        Long loanId = Long.parseLong(messageText);
                        // Validar que el ID sea de un préstamo pendiente suyo
                        boolean validId = loanService.getPendingLoans(user).stream()
                                .anyMatch(l -> l.getId().equals(loanId));

                        if (!validId) {
                            sendMessage(chatId, "ID inválido. Asegúrate de escribir el número correcto de la lista.");
                            return;
                        }

                        tempAccounts.put(chatId + "_LOAN_ID", messageText);
                        userStates.put(chatId, "ESPERANDO_CUENTA_COBRO");
                        sendAccountListPrompt(chatId, accountService.getAccountsByUser(user), "¿A qué cuenta ingresó el dinero que te devolvieron?");
                    } catch (NumberFormatException e) {
                        sendMessage(chatId, "Ingresa solo el número de ID (Ej: 1).");
                    }
                    return;
                }

                else if (currentState.equals("ESPERANDO_CUENTA_COBRO")) {
                    boolean accountExists = accountService.getAccountsByUser(user).stream()
                            .anyMatch(a -> a.getName().equalsIgnoreCase(messageText));

                    if (!accountExists) {
                        sendMessage(chatId, "Esa cuenta no existe.");
                        return;
                    }

                    String exactAccountName = accountService.getAccountsByUser(user).stream()
                            .filter(a -> a.getName().equalsIgnoreCase(messageText))
                            .findFirst().get().getName();

                    try {
                        Account destAccount = accountService.getAccountsByUser(user).stream()
                                .filter(a -> a.getName().equals(exactAccountName))
                                .findFirst().get();

                        Long loanId = Long.parseLong(tempAccounts.get(chatId + "_LOAN_ID"));
                        loanService.payLoan(loanId, destAccount);

                        sendMessage(chatId, "¡Cobro exitoso! El dinero se ha sumado a tu cuenta " + exactAccountName + " y el préstamo está marcado como PAGADO.");
                    } catch (RuntimeException e) {
                        sendMessage(chatId, "Error: " + e.getMessage());
                    } finally {
                        clearStates(chatId);
                    }
                    return;
                }
            }

            if (messageText.startsWith("/")) {
                AppUser user;
                switch (messageText.toLowerCase()) {
                    case "/start":
                        user = appUserService.registerUserIfNotExists(chatId, userFirstName);
                        if (accountService.getAccountsByUser(user).isEmpty()) {
                            accountService.createdAccount(user, "Efectivo");
                        }
                        sendMessageAndRemoveKeyboard(chatId, "¡Hola, " + user.getAlias() + "! \nUsa /comandos para ver lo que puedo hacer.");
                        break;

                    case "/comandos":
                        String helpText = "Comandos Disponibles:\n\n" +
                                "/gasto - Registrar un gasto\n" +
                                "/ingreso - Registrar un ingreso\n" +
                                "/transferir - Mover dinero entre cuentas\n" +
                                "/prestar - Prestar dinero a alguien\n" +
                                "/cobrar - Registrar que te pagaron un préstamo\n" +
                                "/prestamos - Ver quién te debe dinero\n" +
                                "/saldo - Ver saldo total\n" +
                                "/cuentas - Ver todas tus cuentas\n" +
                                "/nuevacuenta - Crear una cuenta\n" +
                                "/cancelar - Cancelar operación";
                        sendMessage(chatId, helpText);
                        break;

                    case "/saldo":
                        user = appUserService.getUserByTelegramId(chatId).orElse(null);
                        if (user != null) {
                            BigDecimal total = accountService.getTotalBalance(user);
                            sendMessage(chatId, "Tu saldo total en cuentas es: S/ " + total);
                        }
                        break;

                    case "/cuentas":
                    case "/nuevacuenta":
                    case "/gasto":
                    case "/ingreso":
                    case "/transferir":
                        handleStandardCommands(messageText, chatId);
                        break;

                    case "/prestar":
                        user = appUserService.getUserByTelegramId(chatId).orElse(null);
                        if (user != null) {
                            userStates.put(chatId, "ESPERANDO_CUENTA_PRESTAMO");
                            sendAccountListPrompt(chatId, accountService.getAccountsByUser(user), "¿De qué cuenta saldrá el dinero para prestar?");
                        }
                        break;

                    case "/cobrar":
                        user = appUserService.getUserByTelegramId(chatId).orElse(null);
                        if (user != null) {
                            List<Loan> pendingLoans = loanService.getPendingLoans(user);
                            if (pendingLoans.isEmpty()) {
                                sendMessage(chatId, "No tienes préstamos pendientes por cobrar. ¡Todos están al día!");
                            } else {
                                StringBuilder sb = new StringBuilder("Préstamos Pendientes:\n\n");
                                for (Loan l : pendingLoans) {
                                    sb.append("ID: ").append(l.getId()).append(" | ").append(l.getDebtorName())
                                            .append(" debe S/").append(l.getAmount()).append("\n");
                                }
                                sb.append("\nEscribe el número de ID del préstamo que te acaban de pagar:");
                                userStates.put(chatId, "ESPERANDO_ID_PRESTAMO");
                                sendMessage(chatId, sb.toString());
                            }
                        }
                        break;

                    case "/prestamos":
                        user = appUserService.getUserByTelegramId(chatId).orElse(null);
                        if (user != null) {
                            List<Loan> pendingLoans = loanService.getPendingLoans(user);
                            if (pendingLoans.isEmpty()) {
                                sendMessage(chatId, "No tienes préstamos por cobrar.");
                            } else {
                                StringBuilder sb = new StringBuilder("Lista de Préstamos:\n\n");
                                BigDecimal totalDeuda = BigDecimal.ZERO;
                                for (Loan l : pendingLoans) {
                                    sb.append("- ").append(l.getDebtorName()).append(": S/").append(l.getAmount()).append("\n");
                                    totalDeuda = totalDeuda.add(l.getAmount());
                                }
                                sb.append("\nTotal de dinero prestado: S/").append(totalDeuda);
                                sendMessage(chatId, sb.toString());
                            }
                        }
                        break;

                    default:
                        sendMessage(chatId, "Comando no reconocido. Escribe /comandos para ver la lista de comandos.");
                        break;
                }
            } else if (!userStates.containsKey(chatId)) {
                sendMessage(chatId, "No entiendo ese mensaje. Por favor usa un comando de la lista /comandos.");
            }
        }
    }

    private void handleStandardCommands(String command, String chatId) {
        AppUser user = appUserService.getUserByTelegramId(chatId).orElse(null);
        if (user == null) return;

        switch (command.toLowerCase()) {
            case "/cuentas":
                List<Account> accounts = accountService.getAccountsByUser(user);
                StringBuilder sb = new StringBuilder("Tus cuentas actuales:\n\n");
                for (Account a : accounts) {
                    sb.append("- ").append(a.getName()).append(": S/ ").append(a.getBalance()).append("\n");
                }
                sendMessage(chatId, sb.toString());
                break;
            case "/nuevacuenta":
                userStates.put(chatId, "ESPERANDO_NOMBRE_CUENTA");
                sendMessage(chatId, "Vamos a crear una nueva cuenta.\n¿Cómo se llama? (Ej: Yape, BCP, Efectivo):");
                break;
            case "/gasto":
                userStates.put(chatId, "ESPERANDO_CUENTA_GASTO");
                sendAccountListPrompt(chatId, accountService.getAccountsByUser(user), "¿De qué cuenta salió el dinero?");
                break;
            case "/ingreso":
                userStates.put(chatId, "ESPERANDO_CUENTA_INGRESO");
                sendAccountListPrompt(chatId, accountService.getAccountsByUser(user), "¿A qué cuenta ingresó el dinero?");
                break;
            case "/transferir":
                List<Account> accs = accountService.getAccountsByUser(user);
                if (accs.size() < 2) {
                    sendMessage(chatId, "Necesitas al menos 2 cuentas para hacer una transferencia.");
                } else {
                    userStates.put(chatId, "ESPERANDO_CUENTA_ORIGEN_TRANSF");
                    sendAccountListPrompt(chatId, accs, "¿De qué cuenta saldrá el dinero? (ORIGEN)");
                }
                break;
        }
    }

    private void sendAccountListPrompt(String chatId, List<Account> accounts, String question) {
        StringBuilder sb = new StringBuilder(question).append("\n\nTus cuentas son:\n");
        for (Account a : accounts) {
            sb.append("- ").append(a.getName()).append("\n");
        }
        sb.append("\nEscribe el nombre de la cuenta:");
        sendMessage(chatId, sb.toString());
    }

    private void clearStates(String chatId) {
        userStates.remove(chatId);
        tempAmounts.remove(chatId);
        tempAccounts.remove(chatId);
        tempAccounts.remove(chatId + "_ORIGEN");
        tempAccounts.remove(chatId + "_DESTINO");
        tempAccounts.remove(chatId + "_DEUDOR");
        tempAccounts.remove(chatId + "_LOAN_ID");
    }

    private void sendMessage(String chatId, String text) {
        SendMessage message = new SendMessage();
        message.setChatId(chatId);
        message.setText(text);
        try { execute(message); } catch (TelegramApiException e) { e.printStackTrace(); }
    }

    private void sendMessageAndRemoveKeyboard(String chatId, String text) {
        SendMessage message = new SendMessage();
        message.setChatId(chatId);
        message.setText(text);

        ReplyKeyboardRemove removeKeyboard = new ReplyKeyboardRemove();
        removeKeyboard.setRemoveKeyboard(true);
        message.setReplyMarkup(removeKeyboard);

        try { execute(message); } catch (TelegramApiException e) { e.printStackTrace(); }
    }
}
