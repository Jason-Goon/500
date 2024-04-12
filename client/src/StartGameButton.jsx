import React, { useState } from 'react';
import socket from './utils/socket';
import './StartGameButton.css';

const StartGameButton = () => {
  const [isStarting, setIsStarting] = useState(false);

  const handleStartGame = () => {
    setIsStarting(true); 
    socket.emit('startGame');
    
    socket.on('gameStarted', () => {
      setIsStarting(false); 
    });
  };

  return (
    <button onClick={handleStartGame} disabled={isStarting}>
      {isStarting ? 'Starting...' : 'Start Game'}
    </button>
  );
};

export default StartGameButton;
