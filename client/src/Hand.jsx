// src/components/Hand.jsx
import React from 'react';
import Card from './Card';
import './Hand.css'; 

const Hand = ({ cards, onSelectCard, selectedCardIndices }) => {
  return (
    <div className="hand">
      {cards.map((card, index) => (
        <div 
          key={index} 
          onClick={() => onSelectCard(index)}
          className={`card ${
            selectedCardIndices.includes(index)
              ? selectedCardIndices.length > 1
                ? 'multi-selected'
                : 'single-selected'
              : ''
          }`}
        >
          {}
          <Card value={card.value} suit={card.suit} />
        </div>
      ))}
    </div>
  );
};

export default Hand;
