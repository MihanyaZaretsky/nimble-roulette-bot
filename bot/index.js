const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Создаём файл-блокировку для предотвращения дублирования
const fs = require('fs');
const path = require('path');
const lockFile = path.join(__dirname, 'bot.lock');

// Проверяем, не запущен ли уже бот
if (fs.existsSync(lockFile)) {
  const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
  const now = Date.now();
  
  // Если файл блокировки старше 30 секунд, считаем что процесс умер
  if (now - lockData.timestamp < 30000) {
    console.log('⚠️ Бот уже запущен в другом процессе. Завершаем...');
    process.exit(0);
  }
}

// Создаём файл блокировки
const lockData = {
  pid: process.pid,
  timestamp: Date.now(),
  instance: process.env.BOT_INSTANCE || 'main'
};

fs.writeFileSync(lockFile, JSON.stringify(lockData));

// Очищаем файл блокировки при завершении
process.on('exit', () => {
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
  }
});

process.on('SIGINT', () => {
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
  }
  process.exit(0);
});

// Инициализация бота
const botToken = '7335736665:AAHG3rBQQ_zjE6qourTYqHaTvuKDnczztgM';
let bot;

try {
  bot = new TelegramBot(botToken, { 
    polling: true,
    polling_id: process.env.BOT_INSTANCE || 'main'
  });
  
  console.log('🤖 Telegram бот инициализирован с токеном');
} catch (error) {
  console.log('❌ Ошибка инициализации бота:', error.message);
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
  }
  process.exit(1);
}

// Express сервер для API
const app = express();
const PORT = process.env.BOT_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Хранилище данных (в продакшене используйте базу данных)
const gameSessions = new Map();
const userSessions = new Map();

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;
  
  console.log(`Пользователь ${username} (${userId}) запустил бота`);
  
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
  
  await bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: keyboard,
    parse_mode: 'HTML'
  });
});

// Обработка команды /help
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
🎰 <b>Nimble Roulette - Помощь</b>

🎮 <b>Как играть:</b>
1. Нажмите кнопку "Играть в рулетку"
2. Выберите ставку и число
3. Крутите рулетку!
4. Получайте выигрыши

💰 <b>Правила:</b>
• Ставьте на числа от 0 до 36
• Красные числа: 1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
• Черные числа: 2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35
• 0 - зеленое число

🎯 <b>Выигрыши:</b>
• Угадали число: x35
• Угадали цвет: x2
• Угадали чет/нечет: x2

💡 <b>Команды:</b>
/start - Запустить бота
/help - Показать эту справку
/stats - Ваша статистика
  `;
  
  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
});

// Обработка команды /stats
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  const userSession = userSessions.get(userId) || {
    gamesPlayed: 0,
    totalWinnings: 0,
    bestWin: 0
  };
  
  const statsMessage = `
📊 <b>Ваша статистика:</b>

🎮 Игр сыграно: ${userSession.gamesPlayed}
💰 Общий выигрыш: ${userSession.totalWinnings}₽
🏆 Лучший выигрыш: ${userSession.bestWin}₽
  `;
  
  await bot.sendMessage(chatId, statsMessage, { parse_mode: 'HTML' });
});

// API endpoint для получения данных игры
app.get('/api/game/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const gameSession = gameSessions.get(sessionId);
  
  if (!gameSession) {
    return res.status(404).json({ error: 'Сессия не найдена' });
  }
  
  res.json(gameSession);
});

// API endpoint для создания новой игры
app.post('/api/game', (req, res) => {
  const { userId, username, bet, betType } = req.body;
  
  const sessionId = uuidv4();
  const gameSession = {
    id: sessionId,
    userId,
    username,
    bet: parseInt(bet),
    betType, // 'number', 'color', 'even_odd'
    betValue: req.body.betValue,
    status: 'pending',
    result: null,
    winnings: 0,
    createdAt: new Date().toISOString()
  };
  
  gameSessions.set(sessionId, gameSession);
  
  res.json({ sessionId, gameSession });
});

// API endpoint для завершения игры
app.post('/api/game/:sessionId/complete', (req, res) => {
  const { sessionId } = req.params;
  const { result, winnings } = req.body;
  
  const gameSession = gameSessions.get(sessionId);
  if (!gameSession) {
    return res.status(404).json({ error: 'Сессия не найдена' });
  }
  
  gameSession.status = 'completed';
  gameSession.result = result;
  gameSession.winnings = winnings;
  gameSession.completedAt = new Date().toISOString();
  
  // Обновляем статистику пользователя
  const userId = gameSession.userId;
  const userSession = userSessions.get(userId) || {
    gamesPlayed: 0,
    totalWinnings: 0,
    bestWin: 0
  };
  
  userSession.gamesPlayed += 1;
  userSession.totalWinnings += winnings;
  if (winnings > userSession.bestWin) {
    userSession.bestWin = winnings;
  }
  
  userSessions.set(userId, userSession);
  
  // Отправляем уведомление пользователю
  const message = winnings > 0 
    ? `🎉 Поздравляем! Вы выиграли ${winnings}₽!`
    : `😔 К сожалению, вы проиграли ${gameSession.bet}₽. Попробуйте еще раз!`;
  
  bot.sendMessage(userId, message);
  
  res.json({ success: true, gameSession });
});

// API endpoint для получения статистики пользователя
app.get('/api/user/:userId/stats', (req, res) => {
  const { userId } = req.params;
  const userSession = userSessions.get(userId) || {
    gamesPlayed: 0,
    totalWinnings: 0,
    bestWin: 0
  };
  
  res.json(userSession);
});

// Health check endpoint для Render
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Nimble Roulette Bot is running',
    timestamp: new Date().toISOString()
  });
});

// Обработка ошибок
bot.on('error', (error) => {
  console.error('Ошибка бота:', error);
});

bot.on('polling_error', (error) => {
  if (error.code === 'ETELEGRAM' && error.response.body.error_code === 409) {
    console.log('⚠️ Другой экземпляр бота уже запущен. Завершаем этот процесс...');
    // Принудительно завершаем процесс при конфликте
    setTimeout(() => {
      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
      }
      process.exit(0);
    }, 1000);
  } else {
    console.error('Ошибка polling:', error);
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🎰 Nimble Roulette Bot запускается...`);
  console.log(`🤖 Бот запущен на порту ${PORT}`);
  console.log(`📡 API доступен по адресу: http://localhost:${PORT}`);
}); 