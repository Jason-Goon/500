import React, { useState, useEffect } from 'react';
import './App.css';
import GameBoard from './GameBoard';
import StartGameButton from './StartGameButton';
import JoinGameComponent from './JoinGameComponent';
import PlayerInfoPanel from './PlayerInfoPanel'; 
import socket from './utils/socket'; 

function App() {
  const [hasJoined, setHasJoined] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState([]);
  const [discardPileCards, setDiscardPileCards] = useState([]);
  const [playerTableCards, setPlayerTableCards] = useState([]);

  useEffect(() => {
    socket.on('gameStarted', () => setGameStarted(true));

    socket.on('updatePlayers', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('updatePlayerTables', (updatedPlayerTables) => {
      setPlayers(currentPlayers => currentPlayers.map(player => ({
        ...player,
        playTable: updatedPlayerTables[player.id] || player.playTable,
      })));
    });
    

    socket.on('updateDiscardPile', setDiscardPileCards);
    socket.on('updatePlayerTable', setPlayerTableCards);

    return () => {
      socket.off('gameStarted');
      socket.off('updatePlayers');
      socket.off('updatePlayerTables');
      socket.off('updateDiscardPile');
      socket.off('updatePlayerTable');
    };
  }, []); 

  const handleJoin = () => {
    setHasJoined(true);
    socket.emit('joinGame', { name: 'Player Name' }); 
  };


  return (
    <div className="App">
      <h1>500</h1>
      {!hasJoined ? (
        <JoinGameComponent onJoin={handleJoin} />
      ) : (
        <>
          {gameStarted && <PlayerInfoPanel players={players} />}
          <GameBoard discardPileCards={discardPileCards} playerTableCards={playerTableCards} />
          {!gameStarted && (
  <div className="startGameButtonContainer">
    <StartGameButton />
  </div>
)}

        </>
      )}
    </div>
  );
}

export default App;
