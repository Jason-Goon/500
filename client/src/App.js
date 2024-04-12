import React, { useState, useEffect } from 'react';
import './App.css';
import GameBoard from './GameBoard';
import StartGameButton from './StartGameButton';
import JoinGameComponent from './JoinGameComponent';
import PlayerInfoPanel from './PlayerInfoPanel'; // Import the PlayerInfoPanel
import socket from './utils/socket'; // Ensure this import path is correct

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
      // This expects an object mapping but you're emitting gameState.playerTables directly
      // Make sure the emitted data structure matches what's being processed here
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
  }, []); // Removed [players] to prevent unnecessary re-executions

  const handleJoin = () => {
    setHasJoined(true);
    // Emit an event to join the game, handle this in your backend
    socket.emit('joinGame', { name: 'Player Name' }); // Ensure you're sending the correct player name or data
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