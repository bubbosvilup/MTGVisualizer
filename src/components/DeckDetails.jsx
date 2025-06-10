// DeckDetails.jsx
import React from 'react';
import '../styles/DeckDetails.css';

function DeckDetails({ deck, collection = [] }) {
  const collectionMap = new Map();
  collection.forEach((card) => {
    collectionMap.set(card.name.toLowerCase(), card.quantity || 1);
  });

  return (
    <div className="deck-details">
      <h3>{deck.name} – Dettagli</h3>
      <div className="deck-cards-grid">
        {deck.cards.map((card, index) => {
          const owned = collectionMap.get(card.name.toLowerCase()) || 0;
          const isMissing = owned < (card.quantity || 1);

          return (
            <div key={index} className={`deck-card-detail ${isMissing ? 'missing' : 'owned'}`}>
              <img
                src={card.image || 'https://via.placeholder.com/223x310?text=Card'}
                alt={card.name}
              />
              <div className="card-info">
                <div className="card-name">{card.name}</div>
                <div className="card-qty">
                  {owned}/{card.quantity || 1}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DeckDetails;
