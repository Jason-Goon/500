// src/components/DiscardPile.jsx
import React from 'react';
import Card from './Card';
import './DiscardPile.css'; // Ensure this is correctly pointing to your CSS file

const DiscardPile = ({ cards, onSelectCard, selectedIndices }) => {
    return (
        <div className="discardPile">
            <h3>Discard Pile</h3>
            <div className="cards"> {/* This container will hold the cards in a row */}
                {cards.map((card, index) => (
                    // Wrap the Card component in a div that can be clicked
                    <div key={index} onClick={() => onSelectCard(index)} 
                         className={`card-container ${selectedIndices.includes(index) ? 'selected' : ''}`}>
                        <Card value={card.value} suit={card.suit} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DiscardPile;
