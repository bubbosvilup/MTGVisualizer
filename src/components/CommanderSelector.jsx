import React, { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import scryfallData from '../data/scryfall-min.json';
import '../styles/CommanderSelector.css';

function CommanderSelector({ commander, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const commanders = useMemo(() => {
    return scryfallData.filter(
      (card) =>
        card.type?.toLowerCase().includes('legendary') &&
        card.type.toLowerCase().includes('creature')
    );
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(commanders, {
        keys: ['name'],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [commanders]
  );

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length < 2) {
      setResults([]);
      return;
    }
    const res = fuse
      .search(val)
      .map((r) => r.item)
      .slice(0, 10);
    setResults(res);
  };

  const handleSelect = (card) => {
    onSelect(card);
    setQuery('');
    setResults([]);
  };

  if (commander) {
    return (
      <div className="commander-selector selected">
        <img
          src={commander.image || 'https://via.placeholder.com/223x310?text=Commander'}
          alt={commander.name}
        />
        <div className="commander-info">
          <strong>{commander.name}</strong>
          <button onClick={() => onSelect(null)}>❌ Cambia</button>
        </div>
      </div>
    );
  }

  return (
    <div className="commander-selector">
      <input type="text" value={query} onChange={handleChange} placeholder="Cerca comandante..." />
      {results.length > 0 && (
        <ul className="commander-results">
          {results.map((card) => (
            <li key={card.name} onClick={() => handleSelect(card)}>
              {card.image && <img src={card.image} alt={card.name} />}
              <span>{card.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CommanderSelector;
