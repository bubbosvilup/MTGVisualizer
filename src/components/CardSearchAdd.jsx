import React, { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import useScryfall from '../hooks/useScryfall';
import '../styles/CardSearchAdd.css';

function CardSearchAdd({ onAdd }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const scryfallData = useScryfall();

  const fuse = useMemo(
    () =>
      new Fuse(scryfallData, {
        keys: ['name'],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [scryfallData]
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
      .slice(0, 12);
    setResults(res);
  };

  const handleAddCard = (card) => {
    onAdd(card);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="card-search-add">
      <input type="text" value={query} onChange={handleChange} placeholder="Aggiungi carta..." />
      {results.length > 0 && (
        <ul className="card-results">
          {results.map((card) => (
            <li key={card.name} onClick={() => handleAddCard(card)}>
              {card.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CardSearchAdd;
