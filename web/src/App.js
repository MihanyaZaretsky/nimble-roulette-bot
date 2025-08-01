import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [bet, setBet] = useState(100);
  const [betType, setBetType] = useState('number');
  const [betValue, setBetValue] = useState(7);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [winnings, setWinnings] = useState(0);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    // Инициализация Telegram Web App
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // Получаем данные пользователя из URL параметров
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get('user');
      const username = urlParams.get('username');
      
      if (userId && username) {
        setUser({ id: userId, username });
      }
      
      console.log('Telegram Web App инициализирован');
    }
  }, []);

  const createGame = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          username: user.username,
          bet: parseInt(bet),
          betType,
          betValue: betValue ? parseInt(betValue) : null
        })
      });
      
      const data = await response.json();
      setSessionId(data.sessionId);
      return data.sessionId;
    } catch (error) {
      console.error('Ошибка создания игры:', error);
      return null;
    }
  };

  const spinRoulette = async () => {
    if (!sessionId) return;
    
    setIsSpinning(true);
    
    // Симуляция вращения рулетки
    setTimeout(async () => {
      const rouletteResult = Math.floor(Math.random() * 37); // 0-36
      setResult(rouletteResult);
      
      // Расчет выигрыша
      let winAmount = 0;
      if (betType === 'number' && betValue === rouletteResult) {
        winAmount = bet * 35;
      } else if (betType === 'color') {
        const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
        const isRed = redNumbers.includes(rouletteResult);
        const isBetRed = betValue === 'red';
        if ((isRed && isBetRed) || (!isRed && !isBetRed && rouletteResult !== 0)) {
          winAmount = bet * 2;
        }
      } else if (betType === 'even_odd') {
        if (rouletteResult !== 0) {
          const isEven = rouletteResult % 2 === 0;
          const isBetEven = betValue === 'even';
          if (isEven === isBetEven) {
            winAmount = bet * 2;
          }
        }
      }
      
      setWinnings(winAmount);
      
      // Отправляем результат на сервер
      try {
        await fetch(`/api/game/${sessionId}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            result: rouletteResult,
            winnings: winAmount
          })
        });
      } catch (error) {
        console.error('Ошибка завершения игры:', error);
      }
      
      setIsSpinning(false);
    }, 2000);
  };

  const startGame = async () => {
    const newSessionId = await createGame();
    if (newSessionId) {
      await spinRoulette();
    }
  };

  const getNumberColor = (number) => {
    if (number === 0) return 'green';
    const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    return redNumbers.includes(number) ? 'red' : 'black';
  };

  return (
    <div className="App">
      <div className="container">
        <h1>🎰 Nimble Roulette</h1>
        
        {user && (
          <div className="user-info">
            <p>Добро пожаловать, {user.username}!</p>
          </div>
        )}
        
        <div className="game-section">
          <h2>🎮 Настройки игры</h2>
          
          <div className="bet-settings">
            <div className="setting">
              <label>Ставка:</label>
              <input
                type="number"
                value={bet}
                onChange={(e) => setBet(e.target.value)}
                min="10"
                max="10000"
              />
            </div>
            
            <div className="setting">
              <label>Тип ставки:</label>
              <select value={betType} onChange={(e) => setBetType(e.target.value)}>
                <option value="number">На число</option>
                <option value="color">На цвет</option>
                <option value="even_odd">Чет/нечет</option>
              </select>
            </div>
            
            {betType === 'number' && (
              <div className="setting">
                <label>Число (0-36):</label>
                <input
                  type="number"
                  value={betValue}
                  onChange={(e) => setBetValue(e.target.value)}
                  min="0"
                  max="36"
                />
              </div>
            )}
            
            {betType === 'color' && (
              <div className="setting">
                <label>Цвет:</label>
                <select value={betValue} onChange={(e) => setBetValue(e.target.value)}>
                  <option value="red">Красный</option>
                  <option value="black">Черный</option>
                </select>
              </div>
            )}
            
            {betType === 'even_odd' && (
              <div className="setting">
                <label>Выбор:</label>
                <select value={betValue} onChange={(e) => setBetValue(e.target.value)}>
                  <option value="even">Четное</option>
                  <option value="odd">Нечетное</option>
                </select>
              </div>
            )}
          </div>
          
          <button 
            className="spin-button"
            onClick={startGame}
            disabled={isSpinning}
          >
            {isSpinning ? '🎲 Крутится...' : '🎲 Крутить рулетку!'}
          </button>
        </div>
        
        {isSpinning && (
          <div className="spinning">
            <div className="spinner">🎰</div>
            <p>Рулетка крутится...</p>
          </div>
        )}
        
        {result !== null && !isSpinning && (
          <div className="result-section">
            <h2>🎯 Результат</h2>
            <div className={`result-number ${getNumberColor(result)}`}>
              {result}
            </div>
            
            {winnings > 0 ? (
              <div className="win-message">
                <h3>🎉 Поздравляем!</h3>
                <p>Вы выиграли {winnings}₽!</p>
              </div>
            ) : (
              <div className="lose-message">
                <h3>😔 Не повезло</h3>
                <p>Попробуйте еще раз!</p>
              </div>
            )}
            
            <button 
              className="play-again-button"
              onClick={() => {
                setResult(null);
                setWinnings(0);
                setSessionId(null);
              }}
            >
              🎮 Играть снова
            </button>
          </div>
        )}
        
        <div className="rules">
          <h3>📋 Правила игры</h3>
          <ul>
            <li><strong>На число:</strong> выигрыш x35</li>
            <li><strong>На цвет:</strong> выигрыш x2</li>
            <li><strong>Чет/нечет:</strong> выигрыш x2</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
