import React, { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import useScryfall from '../hooks/useScryfall';

function CardSearch({
  onSelect,
  filterFn = () => true,
  placeholder = 'Search...',
  resultLimit = 10,
  className = '',
  renderItem,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const scryfallData = useScryfall();

  const data = useMemo(() => scryfallData.filter(filterFn), [scryfallData, filterFn]);

  const fuse = useMemo(
    () =>
      new Fuse(data, {
        keys: ['name'],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [data]
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
      .slice(0, resultLimit);
    setResults(res);
  };

  const handleSelect = (card) => {
    onSelect(card);
    setQuery('');
    setResults([]);
  };

  const defaultRender = (card, select) => (
    <li key={card.name} onClick={select}>
      {card.name}
    </li>
  );

  const renderer = renderItem || defaultRender;

  return (
    <div className={`card-search ${className}`}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="search-input"
      />
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((card) => renderer(card, () => handleSelect(card)))}
        </ul>
      )}
    </div>
  );
}

export default CardSearch;
