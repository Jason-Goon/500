const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 4000;
const MAX_PLAYERS = 4; 
const MIN_PLAYERS_REQUIRED = 1;

let gameState = {
  players: [],
  deck: [],
  gameStarted: false,
  discardPile: [],
  playerTables: {},
};

function generateDeck(includeJokers = true) {
  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
  let deck = [];

  suits.forEach(suit => {
    values.forEach(value => {
      deck.push({ value, suit });
    });
  });

  if (includeJokers) {
    deck.push({ value: 'Joker', suit: 'None', identifier: 'Joker1' });
    deck.push({ value: 'Joker', suit: 'None', identifier: 'Joker2' });
    deck.push({ value: 'Joker', suit: 'None', identifier: 'Joker3' });
  }

  // Shuffle the deck before returning
  return shuffle(deck);
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap
  }
  return deck;
}
function dealCardsToPlayers() {
  const CARDS_PER_PLAYER = 7; 

  gameState.players.forEach(player => {
    player.hand = gameState.deck.splice(0, CARDS_PER_PLAYER); 
    io.to(player.id).emit('updateHand', player.hand); 
  });

  
  if (gameState.deck.length > 0) {
    gameState.discardPile.push(gameState.deck.shift());
    io.emit('updateDiscardPile', gameState.discardPile); // Update all clients with the new discard pile state
  }
}

// Helper function to check if the cards form a valid three of a kind
function isThreeOfAKind(cards) {
  if (cards.length !== 3) return false;
  const firstCardValue = cards[0].value;
  return cards.every(card => card.value === firstCardValue);
}

// Helper function to check if the cards form a valid straight flush
function isStraightFlush(cards) {
  if (cards.length !== 4) return false;
  const suits = new Set(cards.map(card => card.suit));
  if (suits.size > 1) return false; // All cards must be of the same suit

  const values = cards.map(card => {
    if (card.value === 'Ace') return 14;
    if (card.value === 'King') return 13;
    if (card.value === 'Queen') return 12;
    if (card.value === 'Jack') return 11;
    return parseInt(card.value);
  }).sort((a, b) => a - b);

  for (let i = 0; i < values.length - 1; i++) {
    if (values[i + 1] - values[i] !== 1) return false;
  }

  return true;
}

// Assuming isValidPlay checks for either condition
function isValidPlay(cards) {
  return isThreeOfAKind(cards) || isStraightFlush(cards);
}

function initializeGame() {
  gameState = {
    players: [],
    deck: generateDeck(), 
    gameStarted: false,
    discardPile: [],
    playerTables: {},
  };
  console.log('Game initialized');
}

io.on('connection', (socket) => {
  console.log(`New player connected: ${socket.id}`);

  socket.on('joinGame', (data) => {
    const playerName = typeof data === 'object' ? data.name : data; 

    if (!playerName || gameState.gameStarted) {
      socket.emit('joinError', 'Unable to join: Game has already started or name missing.');
      return;
    }

    const player = { id: socket.id, name: playerName, hand: [] };
    gameState.players.push(player);
    console.log(`${playerName} joined the game`);
    io.emit('updateGameState', gameState);

    socket.emit('joinSuccess', { playerName });
  });

  socket.on('startGame', () => {
    if (!gameState.gameStarted && gameState.players.length >= MIN_PLAYERS_REQUIRED) {
      gameState.gameStarted = true;
      gameState.deck = generateDeck();
      dealCardsToPlayers();
      io.emit('gameStarted', gameState);
      console.log('Game started');
    } else {
      console.log('Not enough players to start the game');
      socket.emit('startGameError', 'Not enough players');
    }
  });

  socket.on('drawCard', () => {
    const player = gameState.players.find(p => p.id === socket.id);
    if (player && gameState.deck.length > 0 && gameState.gameStarted) {
      const drawnCard = gameState.deck.shift();
      player.hand.push(drawnCard);
      io.to(socket.id).emit('updateHand', player.hand);
    } else {
      socket.emit('actionError', 'Cannot draw card');
    }
  });

 
  socket.on('placeCardOnDiscardPile', (card) => {
    const player = gameState.players.find(p => p.id === socket.id);
    if (!player || !gameState.gameStarted) {
      socket.emit('actionError', 'Cannot discard cards at this time.');
      return;
    }
  
    const index = player.hand.findIndex(c => c.value === card.value && c.suit === card.suit);
    if (index === -1) {
      socket.emit('actionError', 'Card not in hand');
      return;
    }
  
    // Discard the card and notify all clients
    gameState.discardPile.push(player.hand.splice(index, 1)[0]);
    io.emit('updateDiscardPile', gameState.discardPile); 
    io.to(socket.id).emit('updateHand', player.hand); 
  });


  socket.on('makeContinuationPlay', ({ handCard, tableCards }) => {
    const player = gameState.players.find(p => p.id === socket.id);
    if (!player || !gameState.gameStarted) {
        socket.emit('actionError', 'Cannot make a continuation play at this time.');
        return;
    }

    if (!isValidPlay([handCard, ...tableCards])) {
        socket.emit('playError', 'Invalid continuation play');
        return;
    }

    gameState.playerTables[socket.id].push(handCard);
    player.hand = player.hand.filter(card => card !== handCard);

    io.emit('updateGameState', gameState);
});


  
  
  socket.on('makePlay', ({ handCards, discardIndices = [] }) => {
    const player = gameState.players.find(p => p.id === socket.id);

    if (!player || !gameState.gameStarted) {
        socket.emit('actionError', 'Cannot make a play at this time.');
        return;
    }

 
    const discardCardsToPlay = discardIndices
        .map(index => gameState.discardPile[index])
        .filter(card => card !== undefined);

  
    if (!isValidPlay([...handCards, ...discardCardsToPlay])) {
        socket.emit('playError', 'Invalid play');
        return;
    }

    // If the play is valid, proceed with the updates
    // Remove played hand cards from the player's hand
    player.hand = player.hand.filter(handCard => 
        !handCards.some(cardToPlay => cardToPlay.value === handCard.value && cardToPlay.suit === handCard.suit));

  
    if (discardIndices.length > 0) {
        const minIndex = Math.min(...discardIndices);
        gameState.discardPile.splice(minIndex); // Remove these cards from the discard pile
    }

    // Add played cards to the player's table
    gameState.playerTables[socket.id] = gameState.playerTables[socket.id] || [];
    gameState.playerTables[socket.id].push(...handCards, ...discardCardsToPlay);

    // Broadcast the game state updates
    io.emit('updatePlayerTables', gameState.playerTables);
    io.to(socket.id).emit('updateHand', player.hand);
    io.emit('updateDiscardPile', gameState.discardPile);
    io.to(socket.id).emit('updatePlayerTable', gameState.playerTables[socket.id]);
    io.emit('updateGameState', gameState);
});



  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    // Disconnect logic
  });
});


server.listen(PORT, '0.0.0.0', () => { 
  console.log(`Server running on port ${PORT}`);
});
