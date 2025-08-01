const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Тестовые данные
const testUser = {
  userId: 123456789,
  username: 'testuser',
  bet: 100,
  betType: 'number',
  betValue: 7
};

async function testAPI() {
  console.log('🧪 Начинаем тестирование API...\n');

  try {
    // 1. Создание новой игры
    console.log('1️⃣ Создание новой игры...');
    const createResponse = await axios.post(`${API_BASE_URL}/game`, testUser);
    const { sessionId, gameSession } = createResponse.data;
    console.log('✅ Игра создана:', { sessionId, gameSession });
    console.log('');

    // 2. Получение данных игры
    console.log('2️⃣ Получение данных игры...');
    const getGameResponse = await axios.get(`${API_BASE_URL}/game/${sessionId}`);
    console.log('✅ Данные игры получены:', getGameResponse.data);
    console.log('');

    // 3. Получение статистики пользователя
    console.log('3️⃣ Получение статистики пользователя...');
    const statsResponse = await axios.get(`${API_BASE_URL}/user/${testUser.userId}/stats`);
    console.log('✅ Статистика получена:', statsResponse.data);
    console.log('');

    // 4. Завершение игры (выигрыш)
    console.log('4️⃣ Завершение игры (выигрыш)...');
    const winResponse = await axios.post(`${API_BASE_URL}/game/${sessionId}/complete`, {
      result: 7,
      winnings: 3500
    });
    console.log('✅ Игра завершена (выигрыш):', winResponse.data);
    console.log('');

    // 5. Создание второй игры
    console.log('5️⃣ Создание второй игры...');
    const createResponse2 = await axios.post(`${API_BASE_URL}/game`, {
      ...testUser,
      betValue: 15
    });
    const { sessionId: sessionId2 } = createResponse2.data;
    console.log('✅ Вторая игра создана:', sessionId2);
    console.log('');

    // 6. Завершение второй игры (проигрыш)
    console.log('6️⃣ Завершение второй игры (проигрыш)...');
    const loseResponse = await axios.post(`${API_BASE_URL}/game/${sessionId2}/complete`, {
      result: 22,
      winnings: 0
    });
    console.log('✅ Вторая игра завершена (проигрыш):', loseResponse.data);
    console.log('');

    // 7. Финальная статистика
    console.log('7️⃣ Финальная статистика пользователя...');
    const finalStatsResponse = await axios.get(`${API_BASE_URL}/user/${testUser.userId}/stats`);
    console.log('✅ Финальная статистика:', finalStatsResponse.data);
    console.log('');

    console.log('🎉 Все тесты прошли успешно!');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
  }
}

// Запуск тестов
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI }; 