// DeckCard.jsx
import React from 'react';
import '../styles/DeckCard.css';

function DeckCard({ deck, onClick = () => {} }) {
  const imageUrl = deck.commanderImage || 'https://via.placeholder.com/223x310?text=Commander';
  const commanderName = deck.commanderName || 'Unknown Commander';

  return (
    <div className="deck-card" onClick={() => onClick(deck)}>
      <img src={imageUrl} alt={commanderName} className="deck-card-image" />
      <div className="deck-card-info">
        <div className="deck-card-name">{deck.name}</div>
        <div className="deck-card-percent">{deck.completion}%</div>
      </div>
    </div>
  );
}

export default DeckCard;
