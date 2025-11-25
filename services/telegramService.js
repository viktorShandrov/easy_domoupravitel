import TelegramBot from "node-telegram-bot-api";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Initialize bot
const bot = new TelegramBot(TOKEN);

// ПРОМЯНАТА Е ТУК: Добавяме "export" пред функцията и махаме module.exports отдолу
export async function sendTelegramNotification(chatId, message) {
    if (!chatId) {
        console.warn("Attempted to send Telegram notification without a chatId.");
        return false;
    }
    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        return true;
    } catch (error) {
        console.error(`Error sending Telegram message to ${chatId}:`, error.message);
        return false;
    }
}

// Изтрий този ред:
// module.exports = { sendTelegramNotification };