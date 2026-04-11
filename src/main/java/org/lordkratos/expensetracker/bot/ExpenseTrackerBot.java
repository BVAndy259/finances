package org.lordkratos.expensetracker.bot;

import org.lordkratos.expensetracker.service.AccountService;
import org.lordkratos.expensetracker.service.TransactionService;
import org.springframework.beans.factory.annotation.Value;
import org.lordkratos.expensetracker.model.AppUser;
import org.lordkratos.expensetracker.service.AppUserService;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardRow;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ExpenseTrackerBot extends TelegramLongPollingBot {
    private final AppUserService appUserService;
    private final AccountService accountService;
    private final TransactionService transactionService;
    // Guarda que hace el usuario
    private final Map<String, String> userStates = new ConcurrentHashMap<>();
    // Guarda el monto temporal hasta registrar descripción
    private final Map<String, BigDecimal> tempAmounts = new ConcurrentHashMap<>();

    // Verifica token de bot
    public ExpenseTrackerBot(@Value("${telegram.bot.token}") String botToken, AppUserService appUserService, AccountService accountService, TransactionService transactionService) {
        super(botToken);
        this.appUserService = appUserService;
        this.accountService = accountService;
        this.transactionService = transactionService;
    }

    // Nombre de bot
    @Override
    public String getBotUsername() {
        return "kratos_finanzas_bot";
    }


    @Override
    public void onUpdateReceived(Update update) {
        if (update.hasMessage() && update.getMessage().hasText()) {
            // Verificar texto de mensaje
            String messageText = update.getMessage().getText();
            String chatId = update.getMessage().getChatId().toString();
            String userFirstName = update.getMessage().getFrom().getFirstName();

            System.out.println("Mensaje recibido de " + userFirstName + ": " + messageText);

            // Mientras el usuario está en actividad
            if (userStates.containsKey(chatId)) {
                String currentState = userStates.get(chatId);

                if (currentState.equals("ESPERANDO_MONTO_GASTO")) {
                    try {
                        // Conversión de dinero ingresado
                        BigDecimal amount = new BigDecimal(messageText);
                        tempAmounts.put(chatId, amount); // Guardado temporal
                        userStates.put(chatId, "ESPERANDO_DESC_GASTO");
                        sendMessage(chatId, "Monto anotado: S/" + amount + "\n¿En qué lo gastaste? (Ej: Almuerzo, Pasajes)");
                    } catch (NumberFormatException e) {
                        sendMessage(chatId, "Por favor, ingresa solo números válidos. (Ej: 15.50)");
                    }
                    return;
                }

                else if (currentState.equals("ESPERANDO_DESC_GASTO")) {
                    BigDecimal amount = tempAmounts.get(chatId);
                    AppUser user = appUserService.getUserByTelegramId(chatId).get();
                    var account = accountService.getAccountsByUser(user).get(0);

                    try {
                        // Registrar el gasto
                        transactionService.registerExpense(account, amount, messageText, "Bot");
                        sendMessage(chatId, "✅ ¡Gasto de S/" + amount + " en '" + messageText + "' registrado con éxito!");
                    } catch (RuntimeException e) {
                        // Sin saldo enviado por mensaje
                        sendMessage(chatId, "❌ No se pudo registrar: " + e.getMessage());
                    } finally {
                        // Limpiar memoria
                        userStates.remove(chatId);
                        tempAmounts.remove(chatId);
                    }
                    return;
                }

                else if (currentState.equals("ESPERANDO_MONTO_INGRESO")) {
                    try {
                        BigDecimal amount = new BigDecimal(messageText);
                        tempAmounts.put(chatId, amount);
                        userStates.put(chatId, "ESPERANDO_DESC_INGRESO");
                        sendMessage(chatId, "Monto anotado: S/" + amount + "\n¿De dónde proviene este ingreso? (Ej: Sueldo, Yape de amigo)");
                    } catch (NumberFormatException e) {
                        sendMessage(chatId, "Por favor, ingresa solo números válidos. (Ej: 100.00)");
                    }
                    return;
                }

                else if (currentState.equals("ESPERANDO_DESC_INGRESO")) {
                    BigDecimal amount = tempAmounts.get(chatId);
                    AppUser user = appUserService.getUserByTelegramId(chatId).get();
                    var account = accountService.getAccountsByUser(user).get(0);

                    // Suma de dinero
                    transactionService.registerIncome(account, amount, messageText, "Bot");

                    userStates.remove(chatId);
                    tempAmounts.remove(chatId);

                    sendMessage(chatId, "📈 ¡Ingreso de S/" + amount + " por '" + messageText + "' registrado con éxito!");
                    return;
                }
            }

            // Mientras el usuario está inactivo
            if (messageText.equals("/start")) {
                AppUser user = appUserService.registerUserIfNotExists(chatId, userFirstName);
                if (accountService.getAccountsByUser(user).isEmpty()) {
                    accountService.createdAccount(user, "Billetera Principal");
                }
                sendMenu(chatId, "¡Hola, " + user.getAlias() + "! 🚀\nElige una opción del menú abajo:");
            }
            else if (messageText.equals("💰 Ver Mi Saldo")) {
                AppUser user = appUserService.getUserByTelegramId(chatId).orElse(null);
                if (user != null) {
                    BigDecimal total = accountService.getTotalBalance(user);
                    sendMessage(chatId, "Tu saldo total actual es: S/ " + total);
                }
            }
            else if (messageText.equals("💸 Registrar Gasto")) {
                userStates.put(chatId, "ESPERANDO_MONTO_GASTO");
                sendMessage(chatId, "Vamos a registrar un gasto.\nEscribe el monto usando números (Ej: 25.50):");
            } else if (messageText.equals("📈 Ingresar Saldo")) {
                userStates.put(chatId, "ESPERANDO_MONTO_INGRESO");
                sendMessage(chatId, "Genial. ¿Cuánto dinero ingresó a tu cuenta? (Ej: 50.00):");
            } else {
                sendMessage(chatId, "No reconozco ese comando. Por favor usa los botones del menú de abajo.");
            }
        }
    }

    private void sendMenu(String chatId, String textToSend) {
        SendMessage message = new SendMessage();
        message.setChatId(chatId);
        message.setText(textToSend);

        // Estructura del teclado
        ReplyKeyboardMarkup keyboardMarkup = new ReplyKeyboardMarkup();
        keyboardMarkup.setResizeKeyboard(true); // Se adapta a pantalla
        keyboardMarkup.setOneTimeKeyboard(false); // Fija menú

        // Filas de los botones
        List<KeyboardRow> keyboard = new ArrayList<>();

        // Primera fila
        KeyboardRow row1 = new KeyboardRow();
        row1.add("💸 Registrar Gasto");
        keyboard.add(row1);

        // Segunda fila
        KeyboardRow row2 = new KeyboardRow();
        row2.add("📈 Ingresar Saldo");
        row2.add("💰 Ver Mi Saldo");
        row2.add("🏦 Mis Cuentas");
        keyboard.add(row2);

        // Ensamblar
        keyboardMarkup.setKeyboard(keyboard);
        message.setReplyMarkup(keyboardMarkup);

        try {
            execute(message);
        } catch (TelegramApiException e) {
            System.err.println("Error al enviar el menú a Telegram: " + e.getMessage());
        }
    }

    // Enviar mensaje
    private void sendMessage(String chatId, String welcomeMessage) {
        SendMessage message = new SendMessage();
        message.setChatId(chatId);
        message.setText(welcomeMessage);

        try {
            execute(message);
        } catch (TelegramApiException e) {
            System.err.println("Error al enviar mensaje a Telegram: " + e.getMessage());
        }
    }
}
