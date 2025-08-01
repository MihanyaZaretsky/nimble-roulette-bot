const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

// Простой бот
const bot = new TelegramBot('7335736665:AAHG3rBQQ_zjE6qourTYqHaTvuKDnczztgM', { polling: true });

// Express сервер
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Логируем все обновления
bot.on('message', (msg) => {
  console.log('📨 Получено сообщение:', msg.text, 'от', msg.from.username);
});

// Только команда /start
bot.onText(/\/start/, async (msg) => {
  console.log('🎯 Команда /start получена от:', msg.from.username);
  
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;
  
  const welcomeMessage = `
🎰 Добро пожаловать в Nimble Roulette!

🎮 Это мини-приложение для игры в рулетку прямо в Telegram.

🚀 Нажмите кнопку ниже, чтобы начать игру:
  `;
  
  const keyboard = {
    inline_keyboard: [[
      {
        text: '🎮 Играть в рулетку',
        web_app: { url: `https://quest.somnia.network/campaigns/68?user=${userId}&username=${username}` }
      }
    ]]
  };
  
  try {
    await bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
    console.log('✅ Сообщение отправлено успешно');
  } catch (error) {
    console.error('❌ Ошибка отправки:', error.message);
  }
});

// Принудительно завершаем при конфликте
bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM' && error.response.body.error_code === 409) {
    console.log('⚠️ Конфликт экземпляров. Завершаем процесс...');
    process.exit(0);
  }
});

// Логируем успешное подключение
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

bot.on('error', (error) => {
  console.error('❌ Bot error:', error.message);
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Bot is running' });
});

// Запуск
app.listen(PORT, () => {
  console.log(`Bot started on port ${PORT}`);
  console.log('🤖 Бот готов к работе!');
}); 