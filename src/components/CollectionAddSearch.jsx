import React from 'react';
import CardSearch from './CardSearch';
import '../styles/TabCollection.css';

function CollectionAddSearch({ onAddCard, collection }) {
  const getOwnedQuantity = (name) => {
    const owned = collection.find((c) => c.name.toLowerCase() === name.toLowerCase());
    return owned ? owned.qty : 0;
  };

  return (
    <CardSearch
      onSelect={(card) => onAddCard(card.name)}
      placeholder="Aggiungi una carta..."
      className="add-bar-container"
      renderItem={(card, select) => {
        const imgSrc = card.image_uris?.normal || card.image || null;
        return (
          <li key={card.id || card.name} onClick={select}>
            {imgSrc && <img src={imgSrc} alt={card.name} className="result-img" />}
            <span className="result-name">{card.name}</span>
            <span className="result-qty">Possiedi: {getOwnedQuantity(card.name)}</span>
          </li>
        );
      }}
    />
  );
}

export default CollectionAddSearch;
