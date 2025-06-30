import React from 'react';
import CardSearch from './CardSearch';
import '../styles/CommanderSelector.css';
import useScryfall from '../hooks/useScryfall';

function CommanderSelector({ commander, onSelect }) {
  const filterCommander = (card) =>
    card.type?.toLowerCase().includes('legendary') && card.type.toLowerCase().includes('creature');

  const scryfallData = useScryfall(); // for existing commander image fallback

  if (commander) {
    let imageUrl = 'https://via.placeholder.com/223x310?text=Commander';
    if (typeof commander.image === 'string' && commander.image) {
      imageUrl = commander.image;
    } else {
      const match = scryfallData.find((c) => c.name === commander.name);
      if (match?.image) imageUrl = match.image;
    }

    return (
      <div className="selected-commander">
        <img src={imageUrl} alt={commander.name} className="selected-commander-img" />
        <div className="selected-commander-info">
          <strong>{commander.name}</strong>
          <button onClick={() => onSelect(null)}>❌ Cambia</button>
        </div>
      </div>
    );
  }

  return (
    <CardSearch
      onSelect={onSelect}
      filterFn={filterCommander}
      placeholder="Cerca comandante..."
      className="commander-selector"
      renderItem={(card, select) => (
        <li key={card.name} onClick={select}>
          {card.image && <img src={card.image} alt={card.name} className="result-img" />}
          <span>{card.name}</span>
        </li>
      )}
    />
  );
}

export default CommanderSelector;
