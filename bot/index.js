const TelegramBot = require('node-telegram-bot-api');

// Простой бот
const bot = new TelegramBot('7335736665:AAHG3rBQQ_zjE6qourTYqHaTvuKDnczztgM', { polling: true });

// Только команда /start
bot.onText(/\/start/, async (msg) => {
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
  
  await bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: keyboard,
    parse_mode: 'HTML'
  });
});

console.log('Bot started'); 