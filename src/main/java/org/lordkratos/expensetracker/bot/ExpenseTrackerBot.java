package org.lordkratos.expensetracker.bot;

import org.springframework.beans.factory.annotation.Value;
import org.lordkratos.expensetracker.model.AppUser;
import org.lordkratos.expensetracker.service.AppUserService;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

@Component
public class ExpenseTrackerBot extends TelegramLongPollingBot {
    private final AppUserService appUserService;

    public ExpenseTrackerBot(@Value("${telegram.bot.token}") String botToken, AppUserService appUserService) {
        super(botToken);
        this.appUserService = appUserService;
    }

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

                sendMessage(chatId, welcomeMessage);
            }
        }
    }

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
