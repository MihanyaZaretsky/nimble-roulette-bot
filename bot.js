import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация
const config = {
  token: '7335736665:AAHG3rBQQ_zjE6qourTYqHaTvuKDnczztgM',
  webAppUrl: process.env.WEBAPP_URL || 'https://nimble-roulette.onrender.com', // URL на Render
  port: process.env.PORT || 3000 // Render использует переменную PORT
};

// Создание бота
const bot = new TelegramBot(config.token, { polling: true });

// Создание Express сервера для раздачи статики
const app = express();

// Middleware для парсинга JSON
app.use(express.json());

// Раздача статических файлов из папки dist
app.use(express.static(path.join(__dirname, 'dist')));

// Маршрут для всех остальных запросов (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
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
    console.error('Ошибка отправки Web App:', error);
  }
});

// Обработка текстовых сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Игнорируем команды и сообщения без текста
  if (!text || text.startsWith('/')) {
    return;
  }

  // Обработка обычных сообщений
  const responseMessage = `Получено ваше сообщение: "${text}"

Для работы с приложением используйте команду /start или нажмите кнопку ниже:`;

  const keyboard = {
    inline_keyboard: [
      [{
        text: '🎰 Открыть Nimble Roulette',
        web_app: { url: config.webAppUrl }
      }]
    ]
  };

  try {
    await bot.sendMessage(chatId, responseMessage, {
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Ошибка отправки ответа:', error);
  }
});

// Обработка ошибок бота
bot.on('error', (error) => {
  console.error('Ошибка бота:', error);
});

// Обработка polling ошибок
bot.on('polling_error', (error) => {
  console.error('Ошибка polling:', error);
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