import React from 'react';
import './PlayerInfoPanel.css'; // Ensure this is correctly pointing to your CSS file

const PlayerInfoPanel = ({ playerTables = {}, onSelectPlayerTableCard, selectedPlayerTableCards = [] }) => {
  return (
    <div className="playerInfoPanel">
      {Object.entries(playerTables).map(([playerId, playTable], index) => (
        <div key={playerId} className="playerInfo">
          <h4>Table {index + 1}</h4>
          <div className="playerTableCards">
          {playTable.map((card, cardIndex) => {
  const isSelected = selectedPlayerTableCards.includes(`${playerId}-${cardIndex}`);
  return (
    <div key={cardIndex} 
         onClick={() => onSelectPlayerTableCard(playerId, cardIndex)}
         className={`card ${isSelected ? 'selected' : ''}`}>
      {card.value} of {card.suit}
    </div>
  );
})}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlayerInfoPanel;