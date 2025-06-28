import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Fuse from 'fuse.js';
import scryfallData from '../data/scryfall-min.json';
import '../styles/TabCollection.css';

function CollectionAddSearch({ onAddCard, collection }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  const fuse = useMemo(
    () =>
      new Fuse(scryfallData, {
        keys: ['name'],
        threshold: 0.4,
        distance: 100,
        minMatchCharLength: 2,
        ignoreLocation: true,
      }),
    []
  );

  const performSearch = useCallback(
    (q) => {
      if (q.length <= 1) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      const lower = q.toLowerCase();
      const res = fuse.search(q).map((r) => r.item);
      const seen = new Set();
      const deduped = res.filter((card) => {
        const name = card.name.toLowerCase();
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      });

      const exact = scryfallData.find((c) => c.name.toLowerCase() === lower);
      if (exact) {
        const already = deduped.find((c) => c.name.toLowerCase() === lower);
        if (!already) deduped.unshift(exact);
        else {
          const filtered = deduped.filter((c) => c.name.toLowerCase() !== lower);
          deduped.splice(0, deduped.length, exact, ...filtered);
        }
      }

      setResults(deduped.slice(0, 10));
      setIsSearching(false);
    },
    [fuse]
  );

  const handleChange = useCallback(
    (val) => {
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const trimmed = val.trim();
      if (trimmed.length <= 1) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      debounceRef.current = setTimeout(() => performSearch(trimmed), 300);
    },
    [performSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setResults([]);
        setIsSearching(false);
        setQuery('');
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
      }
    };

    if (results.length > 0 || isSearching || query.trim().length > 0) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [results.length, isSearching, query]);

  const getOwnedQuantity = (name) => {
    const owned = collection.find((c) => c.name.toLowerCase() === name.toLowerCase());
    return owned ? owned.qty : 0;
  };

  return (
    <div ref={containerRef} className="add-bar-container">
      <div className="input-with-icon">
        <span className="icon-search"></span>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Aggiungi una carta..."
          className="add-card-input"
        />
      </div>
      {(isSearching || results.length > 0) && (
        <ul className="add-results-list">
          {isSearching ? (
            <li className="searching-indicator">Ricerca...</li>
          ) : (
            results.map((card) => {
              const imgSrc = card.image_uris?.normal || card.image || null;
              return (
                <li key={card.id || card.name} onClick={() => onAddCard(card.name)}>
                  {imgSrc && <img src={imgSrc} alt={card.name} className="result-img" />}
                  <span className="result-name">{card.name}</span>
                  <span className="result-qty">Possiedi: {getOwnedQuantity(card.name)}</span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

export default CollectionAddSearch;
