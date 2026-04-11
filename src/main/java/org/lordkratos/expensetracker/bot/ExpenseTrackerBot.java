package org.lordkratos.expensetracker.bot;

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

import java.util.ArrayList;
import java.util.List;

@Component
public class ExpenseTrackerBot extends TelegramLongPollingBot {
    private final AppUserService appUserService;

    // Verifica token de bot
    public ExpenseTrackerBot(@Value("${telegram.bot.token}") String botToken, AppUserService appUserService) {
        super(botToken);
        this.appUserService = appUserService;
    }

    // Nombre de bot
    @Override
    public String getBotUsername() {
        return "kratos_finanzas_bot";
    }


    @Override
    public void onUpdateReceived(Update update) {
        if (update.hasMessage() && update.getMessage().hasText()) {
            String messageText = update.getMessage().getText();
            String chatId = update.getMessage().getChatId().toString();
            String userFirstName = update.getMessage().getFrom().getFirstName();

            System.out.println("Mensaje recibido de " + userFirstName + ": " + messageText);

            if (messageText.equals("/start")) {
                AppUser user = appUserService.registerUserIfNotExists(chatId, userFirstName);
                String welcomeMessage = "¡Hola, " + user.getAlias() + "! \n"
                        + "Tu cuenta ha sido vinculada exitosamente. \n"
                        + "Soy tu asistente financiero. Estoy listo para registrar tus gastos.";

                sendMenu(chatId, welcomeMessage);
            } else if (messageText.equals("💸 Registrar Gasto")) {
                sendMessage(chatId, "Has elegido Registrar Gasto. (Pronto conectaremos la lógica de la BD aquí)");
            } else if (messageText.equals("💰 Ver Mi Saldo")) {
                sendMessage(chatId, "Has elegido Ver Saldo. (Pronto sumaremos tus cuentas aquí)");
            } else if (messageText.equals("🏦 Mis Cuentas")) {
                sendMessage(chatId, "Aquí podrás gestionar tus métodos de pago (Yape, Efectivo, etc).");
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
