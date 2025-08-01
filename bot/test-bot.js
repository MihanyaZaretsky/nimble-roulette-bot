const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Express сервер для API (тестовая версия без Telegram бота)
const app = express();
const PORT = process.env.BOT_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Хранилище данных (в продакшене используйте базу данных)
const gameSessions = new Map();
const userSessions = new Map();

// Тестовый endpoint для проверки работы сервера
app.get('/', (req, res) => {
  res.json({
    message: '🎰 Nimble Roulette Bot API работает!',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET / - Информация о сервере',
      'GET /api/game/:sessionId - Получение данных игры',
      'POST /api/game - Создание новой игры',
      'POST /api/game/:sessionId/complete - Завершение игры',
      'GET /api/user/:userId/stats - Статистика пользователя'
    ]
  });
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
  const { userId, username, bet, betType, betValue } = req.body;
  
  if (!userId || !bet || !betType) {
    return res.status(400).json({ 
      error: 'Необходимые поля: userId, bet, betType' 
    });
  }
  
  const sessionId = uuidv4();
  const gameSession = {
    id: sessionId,
    userId: parseInt(userId),
    username: username || 'anonymous',
    bet: parseInt(bet),
    betType, // 'number', 'color', 'even_odd'
    betValue: betValue || null,
    status: 'pending',
    result: null,
    winnings: 0,
    createdAt: new Date().toISOString()
  };
  
  gameSessions.set(sessionId, gameSession);
  
  console.log(`🎮 Создана новая игра: ${sessionId} для пользователя ${userId}`);
  
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
  
  console.log(`🎯 Игра ${sessionId} завершена. Результат: ${result}, Выигрыш: ${winnings}₽`);
  
  res.json({ success: true, gameSession });
});

// API endpoint для получения статистики пользователя
app.get('/api/user/:userId/stats', (req, res) => {
  const { userId } = req.params;
  const userSession = userSessions.get(parseInt(userId)) || {
    gamesPlayed: 0,
    totalWinnings: 0,
    bestWin: 0
  };
  
  res.json(userSession);
});

// API endpoint для получения всех активных игр
app.get('/api/games', (req, res) => {
  const activeGames = Array.from(gameSessions.values())
    .filter(game => game.status === 'pending');
  
  res.json({
    activeGames,
    totalGames: gameSessions.size,
    activeCount: activeGames.length
  });
});

// API endpoint для очистки старых игр (для тестирования)
app.delete('/api/games/clear', (req, res) => {
  const beforeCount = gameSessions.size;
  gameSessions.clear();
  userSessions.clear();
  
  res.json({
    message: 'Все игры очищены',
    clearedGames: beforeCount
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🤖 Тестовый бот запущен на порту ${PORT}`);
  console.log(`📡 API доступен по адресу: http://localhost:${PORT}`);
  console.log(`🧪 Для тестирования запустите: npm run test:api`);
  console.log('');
  console.log('🎰 Nimble Roulette Test Bot готов к работе!');
});

module.exports = app; 