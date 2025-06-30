import React from 'react';
import CardSearch from './CardSearch';
import '../styles/CardSearchAdd.css';

function CardSearchAdd({ onAdd }) {
  return (
    <CardSearch
      onSelect={onAdd}
      placeholder="Aggiungi carta..."
      className="card-search-add"
      renderItem={(card, select) => (
        <li key={card.name} onClick={select}>
          {card.name}
        </li>
      )}
    />
  );
}

export default CardSearchAdd;
