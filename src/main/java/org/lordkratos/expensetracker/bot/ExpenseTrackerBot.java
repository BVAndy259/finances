package org.lordkratos.expensetracker.bot;

import org.lordkratos.expensetracker.model.Account;
import org.lordkratos.expensetracker.service.AccountService;
import org.lordkratos.expensetracker.service.TransactionService;
import org.springframework.beans.factory.annotation.Value;
import org.lordkratos.expensetracker.model.AppUser;
import org.lordkratos.expensetracker.service.AppUserService;
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

    private final Map<String, String> userStates = new ConcurrentHashMap<>();
    private final Map<String, BigDecimal> tempAmounts = new ConcurrentHashMap<>();
    private final Map<String, String> tempAccounts = new ConcurrentHashMap<>();

    public ExpenseTrackerBot(@Value("${telegram.bot.token}") String botToken,
                             AppUserService appUserService,
                             AccountService accountService,
                             TransactionService transactionService) {
        super(botToken);
        this.appUserService = appUserService;
        this.accountService = accountService;
        this.transactionService = transactionService;
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
                sendMessageAndRemoveKeyboard(chatId, "🚫 Operación cancelada. Escribe /ayuda para ver los comandos.");
                return;
            }

            if (userStates.containsKey(chatId)) {
                String currentState = userStates.get(chatId);
                AppUser user = appUserService.getUserByTelegramId(chatId).get();

                if (currentState.equals("ESPERANDO_NOMBRE_CUENTA")) {
                    accountService.createdAccount(user, messageText);
                    clearStates(chatId);
                    sendMessage(chatId, "🏦 ¡Cuenta '" + messageText + "' creada con éxito! Ya puedes usarla para gastos o ingresos.");
                    return;
                }

                if (currentState.equals("ESPERANDO_CUENTA_GASTO") || currentState.equals("ESPERANDO_CUENTA_INGRESO")) {
                    boolean accountExists = accountService.getAccountsByUser(user).stream()
                            .anyMatch(a -> a.getName().equalsIgnoreCase(messageText));

                    if (!accountExists) {
                        sendMessage(chatId, "❌ Esa cuenta no existe. Escribe un nombre válido o usa /cancelar.");
                        return;
                    }

                    String exactAccountName = accountService.getAccountsByUser(user).stream()
                            .filter(a -> a.getName().equalsIgnoreCase(messageText))
                            .findFirst().get().getName();

                    tempAccounts.put(chatId, exactAccountName);

                    if (currentState.equals("ESPERANDO_CUENTA_GASTO")) {
                        userStates.put(chatId, "ESPERANDO_MONTO_GASTO");
                        sendMessage(chatId, "Has seleccionado: " + exactAccountName + "\n💸 ¿Cuánto gastaste? (Ej: 15.50)");
                    } else {
                        userStates.put(chatId, "ESPERANDO_MONTO_INGRESO");
                        sendMessage(chatId, "Has seleccionado: " + exactAccountName + "\n📈 ¿Cuánto ingresó? (Ej: 50.00)");
                    }
                    return;
                }

                else if (currentState.equals("ESPERANDO_MONTO_GASTO") || currentState.equals("ESPERANDO_MONTO_INGRESO")) {
                    try {
                        BigDecimal amount = new BigDecimal(messageText);
                        tempAmounts.put(chatId, amount);

                        if (currentState.equals("ESPERANDO_MONTO_GASTO")) {
                            userStates.put(chatId, "ESPERANDO_DESC_GASTO");
                            sendMessage(chatId, "Monto: S/" + amount + "\n📝 ¿En qué lo gastaste? (Ej: Pasajes)");
                        } else {
                            userStates.put(chatId, "ESPERANDO_DESC_INGRESO");
                            sendMessage(chatId, "Monto: S/" + amount + "\n📝 ¿De dónde proviene? (Ej: Sueldo)");
                        }
                    } catch (NumberFormatException e) {
                        sendMessage(chatId, "❌ Por favor, ingresa solo números (Ej: 20.00). Si deseas salir usa /cancelar.");
                    }
                    return;
                }

                else if (currentState.equals("ESPERANDO_DESC_GASTO") || currentState.equals("ESPERANDO_DESC_INGRESO")) {
                    BigDecimal amount = tempAmounts.get(chatId);
                    String accountName = tempAccounts.get(chatId);

                    Account selectedAccount = accountService.getAccountsByUser(user).stream()
                            .filter(a -> a.getName().equals(accountName))
                            .findFirst().get();

                    try {
                        if (currentState.equals("ESPERANDO_DESC_GASTO")) {
                            transactionService.registerExpense(selectedAccount, amount, messageText, "Bot");
                            sendMessage(chatId, "✅ Gasto de S/" + amount + " en '" + messageText + "' restado de " + accountName);
                        } else {
                            transactionService.registerIncome(selectedAccount, amount, messageText, "Bot");
                            sendMessage(chatId, "📈 Ingreso de S/" + amount + " por '" + messageText + "' sumado a " + accountName);
                        }
                    } catch (RuntimeException e) {
                        sendMessage(chatId, "❌ Error: " + e.getMessage());
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
                            accountService.createdAccount(user, "Billetera Principal");
                        }
                        sendMessageAndRemoveKeyboard(chatId, "¡Hola, " + user.getAlias() + "! 🚀\nUsa /ayuda para ver lo que puedo hacer.");
                        break;

                    case "/ayuda":
                    case "/comandos":
                        String helpText = "🤖 *Comandos Disponibles:*\n\n" +
                                "💸 /gasto - Registrar un nuevo gasto\n" +
                                "📈 /ingreso - Registrar un nuevo ingreso\n" +
                                "💰 /saldo - Ver tu saldo total consolidado\n" +
                                "🏦 /cuentas - Ver todas tus cuentas\n" +
                                "➕ /nuevacuenta - Crear una cuenta (Ej: Yape)\n" +
                                "🚫 /cancelar - Cancelar cualquier operación";
                        sendMessage(chatId, helpText);
                        break;

                    case "/saldo":
                        user = appUserService.getUserByTelegramId(chatId).orElse(null);
                        if (user != null) {
                            BigDecimal total = accountService.getTotalBalance(user);
                            sendMessage(chatId, "💰 Tu saldo total actual es: S/ " + total);
                        }
                        break;

                    case "/cuentas":
                        user = appUserService.getUserByTelegramId(chatId).orElse(null);
                        if (user != null) {
                            List<Account> accounts = accountService.getAccountsByUser(user);
                            StringBuilder sb = new StringBuilder("🏦 *Tus cuentas actuales:*\n\n");
                            for (Account a : accounts) {
                                sb.append("- ").append(a.getName()).append(": S/ ").append(a.getBalance()).append("\n");
                            }
                            sendMessage(chatId, sb.toString());
                        }
                        break;

                    case "/nuevacuenta":
                        userStates.put(chatId, "ESPERANDO_NOMBRE_CUENTA");
                        sendMessage(chatId, "➕ Vamos a crear una nueva cuenta.\n¿Cómo se llama? (Ej: Yape, BCP, Efectivo):");
                        break;

                    case "/gasto":
                        user = appUserService.getUserByTelegramId(chatId).orElse(null);
                        if (user != null) {
                            userStates.put(chatId, "ESPERANDO_CUENTA_GASTO");
                            sendAccountListPrompt(chatId, accountService.getAccountsByUser(user), "💸 ¿De qué cuenta salió el dinero?");
                        }
                        break;

                    case "/ingreso":
                        user = appUserService.getUserByTelegramId(chatId).orElse(null);
                        if (user != null) {
                            userStates.put(chatId, "ESPERANDO_CUENTA_INGRESO");
                            sendAccountListPrompt(chatId, accountService.getAccountsByUser(user), "📈 ¿A qué cuenta ingresó el dinero?");
                        }
                        break;

                    default:
                        sendMessage(chatId, "Comando no reconocido. Escribe /ayuda para ver la lista de comandos.");
                        break;
                }
            } else {
                sendMessage(chatId, "No entiendo ese mensaje. Por favor usa un comando como /gasto o /ayuda.");
            }
        }
    }

    private void sendAccountListPrompt(String chatId, List<Account> accounts, String question) {
        StringBuilder sb = new StringBuilder(question).append("\n\n*Tus cuentas son:*\n");
        for (Account a : accounts) {
            sb.append("- ").append(a.getName()).append("\n");
        }
        sb.append("\n✍️ Escribe el nombre de la cuenta:");
        sendMessage(chatId, sb.toString());
    }

    private void clearStates(String chatId) {
        userStates.remove(chatId);
        tempAmounts.remove(chatId);
        tempAccounts.remove(chatId);
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