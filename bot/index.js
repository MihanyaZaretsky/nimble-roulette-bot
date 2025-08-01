const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Проверяем токен
const token = '7335736665:AAHG3rBQQ_zjE6qourTYqHaTvuKDnczztgM';
console.log('🔑 Токен бота:', token);

// Express сервер
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Бот с webhook
const bot = new TelegramBot(token, { webHook: { port: PORT } });

// Устанавливаем webhook
const url = 'https://nimble-roulette-bot-qkve.onrender.com';
bot.setWebHook(`${url}/bot${token}`);

// Тестовое сообщение при запуске
bot.getMe().then((botInfo) => {
  console.log('✅ Бот подключен:', botInfo.username);
  console.log('🌐 Webhook установлен на:', url);
}).catch((error) => {
  console.error('❌ Ошибка подключения бота:', error.message);
});

// Только команда /start
bot.onText(/\/start/, async (msg) => {
  console.log('🎯 Получена команда /start от:', msg.from.username);
  
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
    console.log('✅ Сообщение отправлено');
  } catch (error) {
    console.error('❌ Ошибка отправки:', error.message);
  }
});

// Webhook endpoint
app.post(`/bot${token}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Запуск
app.listen(PORT, () => {
  console.log(`Bot started on port ${PORT}`);
}); 