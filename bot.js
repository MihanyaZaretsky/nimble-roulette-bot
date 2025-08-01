import TelegramBot from 'node-telegram-bot-api';
import express from 'express';

// Конфигурация
const config = {
  token: '7335736665:AAHG3rBQQ_zjE6qourTYqHaTvuKDnczztgM',
  webAppUrl: process.env.WEBAPP_URL || 'https://nimble-roulette.onrender.com',
  port: process.env.PORT || 3000
};

// Создание бота
const bot = new TelegramBot(config.token, { polling: true });

// Создание Express сервера только для health check
const app = express();

// Health check для Render
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Bot is running',
    timestamp: new Date().toISOString()
  });
});

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.first_name;
  
  const welcomeMessage = `🎰 Добро пожаловать в <b>Nimble Roulette</b>! 🎰

Привет, ${username}! 👋

🎲 <b>Добро пожаловать в мир азартных игр!</b>

Здесь вы можете:
• 🎯 Играть в рулетку
• 💰 Делать ставки
• 🏆 Участвовать в турнирах
• 📊 Просматривать статистику
• 🎁 Получать бонусы

Нажмите кнопку ниже, чтобы открыть игру:`;

  const keyboard = {
    inline_keyboard: [
      [{
        text: '🎰 Открыть Nimble Roulette',
        web_app: { url: config.webAppUrl }
      }]
    ]
  };

  try {
    await bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
    console.log(`✅ Отправлено приветствие пользователю ${username} (${chatId})`);
  } catch (error) {
    console.error('❌ Ошибка отправки сообщения:', error);
  }
});

// Обработка команды /webapp
bot.onText(/\/webapp/, async (msg) => {
  const chatId = msg.chat.id;
  
  const keyboard = {
    inline_keyboard: [
      [{
        text: 'Open',
        web_app: { url: config.webAppUrl }
      }]
    ]
  };

  try {
    await bot.sendMessage(chatId, ' ', {
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('❌ Ошибка отправки Web App:', error);
  }
});

// Обработка ошибок бота
bot.on('error', (error) => {
  console.error('❌ Ошибка бота:', error);
});

// Обработка polling ошибок с игнорированием 409
bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM' && error.response && error.response.statusCode === 409) {
    console.log('⚠️ Конфликт экземпляров бота. Игнорируем...');
    return;
  }
  console.error('❌ Ошибка polling:', error);
});

// Запуск сервера
app.listen(config.port, () => {
  console.log(`🚀 Сервер запущен на порту ${config.port}`);
  console.log(`🌐 Мини-апп доступен по адресу: ${config.webAppUrl}`);
  console.log(`🤖 Бот готов к работе!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал SIGINT, завершение работы...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал SIGTERM, завершение работы...');
  bot.stopPolling();
  process.exit(0);
});

export { bot, app }; 