import React, { useState, useEffect } from 'react';
import socket from './utils/socket';
import Hand from './Hand';
import DiscardPile from './DiscardPile';
import PlayerTable from './PlayerTable';
import PlayerInfoPanel from './PlayerInfoPanel';

const GameBoard = () => {
  const [hand, setHand] = useState([]);
  const [discardPileCards, setDiscardPileCards] = useState([]);
  const [playerTableCards, setPlayerTableCards] = useState([]);
  const [selectedCardIndices, setSelectedCardIndices] = useState([]);
  const [playerTables, setPlayerTables] = useState([]);
  const [selectedDiscardIndices, setSelectedDiscardIndices] = useState([]);
  const [selectedPlayerTableCards, setSelectedPlayerTableCards] = useState([]);


  useEffect(() => {
    socket.on('dealCards', setHand);
    socket.on('updateHand', setHand);
    socket.on('updateDiscardPile', setDiscardPileCards);
    socket.on('updatePlayerTable', setPlayerTableCards);
    socket.on('updatePlayerTables', (updatedPlayerTables) => {
      setPlayerTables(updatedPlayerTables);
    });

    return () => {
      socket.off('dealCards');
      socket.off('updateHand');
      socket.off('updateDiscardPile');
      socket.off('updatePlayerTable');
      socket.off('updatePlayerTables');
    };
  }, []);

  const handleSelectDiscardCard = (index) => {
    // Toggle selection for multiple discard pile cards
    setSelectedDiscardIndices(prevIndices => {
      const indexPosition = prevIndices.indexOf(index);
      if (indexPosition === -1) {
        // If not already selected, add to selections
        return [...prevIndices, index];
      } else {
        // If already selected, remove from selections
        return prevIndices.filter(i => i !== index);
      }
    });
  };

  const onSelectPlayerTableCard = (tableIndex, cardIndex) => {
    const key = `${tableIndex}-${cardIndex}`;
    setSelectedPlayerTableCards(prev => 
        prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
};

  
  const handleSelectCard = (index) => {
    setSelectedCardIndices(prevIndices => 
      prevIndices.includes(index) ? prevIndices.filter(i => i !== index) : [...prevIndices, index]
    );
  };

  const makeContinuationPlay = () => {
    console.log('playerTables:', playerTables);
    console.log('Selected Player Table Cards:', selectedPlayerTableCards);

    // Assuming selectedPlayerTableCards format is "playerId-cardIndex"
    const cardsFromTables = selectedPlayerTableCards.map(key => {
        const [playerId, cardIndex] = key.split('-');
        const cardIndexNumber = parseInt(cardIndex, 10); // Ensure cardIndex is a number

        if (!playerTables[playerId] || !playerTables[playerId][cardIndexNumber]) {
            console.error(`No card found for playerId: ${playerId} at index: ${cardIndexNumber}`);
            return null;
        }

        return playerTables[playerId][cardIndexNumber];
    }).filter(card => card !== null);

    const handCard = selectedCardIndices.length === 1 ? hand[selectedCardIndices[0]] : null;

    if (handCard && cardsFromTables.length) {
        const playData = {
            handCard: handCard,
            tableCards: cardsFromTables,
        };
        socket.emit('makeContinuationPlay', playData);
        setSelectedCardIndices([]);
        setSelectedPlayerTableCards([]);
    } else {
        alert("Please ensure you've selected exactly one card from your hand and at least one card from other players' tables.");
    }
};



  const placeCardsOnPlayerTable = () => {
    const selectedHandCards = selectedCardIndices.map(index => hand[index]);
    // Adjust playData to include multiple discard indices
    const playData = {
      handCards: selectedHandCards,
      discardIndices: selectedDiscardIndices,
    };

    socket.emit('makePlay', playData);
    setSelectedCardIndices([]);
    setSelectedDiscardIndices([]);
  };

  const placeCardOnDiscardPile = () => {
    if (selectedCardIndices.length === 1) {
      const selectedIndex = selectedCardIndices[0];
      const cardToDiscard = hand[selectedIndex];
      socket.emit('placeCardOnDiscardPile', cardToDiscard);
      setSelectedCardIndices([]);
    } else {
      alert("Please select exactly one card to discard.");
    }
  };

  const drawCardFromPack = () => {
    socket.emit('drawCard');
  };

  // The rest of your GameBoard logic here...
  console.log('GameBoard - playerTables:', playerTables); // Log the state of playerTables

  return (
    <div className="gameBoard">
      <>
        {playerTables && (
          <PlayerInfoPanel
            playerTables={playerTables}
            onSelectPlayerTableCard={onSelectPlayerTableCard}
            selectedPlayerTableCards={selectedPlayerTableCards}
          />
        )}
        <DiscardPile
          cards={discardPileCards}
          onSelectCard={handleSelectDiscardCard}
          selectedIndices={selectedDiscardIndices}
          allowMultiSelect={true}
        />
        <PlayerTable cards={playerTableCards} />
        <button onClick={makeContinuationPlay}>Continue Play</button>
        <button onClick={drawCardFromPack}>Draw Deck</button>
        <button onClick={placeCardsOnPlayerTable}>Make Play</button>
        <button onClick={placeCardOnDiscardPile}>Discard Selected</button>
        <Hand
          cards={hand}
          onSelectCard={handleSelectCard}
          selectedCardIndices={selectedCardIndices}
        />
      </>
    </div>
  );
};

export default GameBoard;