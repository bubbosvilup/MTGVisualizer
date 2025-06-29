import React, { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import useScryfall from '../hooks/useScryfall';
import '../styles/CommanderSelector.css';

function CommanderSelector({ commander, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const scryfallData = useScryfall();

  const commanders = useMemo(() => {
    return scryfallData.filter(
      (card) =>
        card.type?.toLowerCase().includes('legendary') &&
        card.type.toLowerCase().includes('creature')
    );
  }, [scryfallData]);

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
    let imageUrl = 'https://via.placeholder.com/223x310?text=Commander';
    if (typeof commander.image === 'string' && commander.image) {
      // Use the provided image directly. Previous logic attempted to
      // replace the `/png/` or `/small/` segments with `/normal/`, but this
      // produced URLs that do not exist on Scryfall and resulted in broken
      // images. Keeping the original URL ensures the image loads correctly.
      imageUrl = commander.image;
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
    <div className="commander-selector">
      <input type="text" value={query} onChange={handleChange} placeholder="Cerca comandante..." />
      {results.length > 0 && (
        <ul className="commander-results">
          {results.map((card) => (
            <li key={card.name} onClick={() => handleSelect(card)}>
              {card.image && <img src={card.image} alt={card.name} className="result-img" />}
              <span>{card.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CommanderSelector;
