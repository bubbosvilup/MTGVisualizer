// TabCollection.jsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import '../styles/TabCollection.css';
import parseCollectionFromText from '../utils/parseCollection';
import scryfallData from '../data/scryfall-min.json';
import Fuse from 'fuse.js';
import { useDecks } from '../context/useDecks';

function TabCollection() {
  const { collection, setCollection } = useDecks();
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [filterColor, setFilterColor] = useState('');
  const [notification, setNotification] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [addResults, setAddResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedCard, setHighlightedCard] = useState('');

  // Ref per il timeout del debounce
  const debounceTimeoutRef = useRef(null);
  // Ref per il container della ricerca
  const addBarRef = useRef(null);

  const scryfallFuse = useMemo(() => {
    return new Fuse(scryfallData, {
      keys: ['name'],
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
      ignoreLocation: true,
    });
  }, []);

  // Funzione per ottenere il colore del bordo basato sui colori della carta
  const getCardBorderColor = (colors) => {
    if (!colors || colors.length === 0) return '#8B4513'; // Marrone per incolore
    if (colors.length > 1) return '#DAA520'; // Oro per multicolore

    const colorMap = {
      W: '#FFFBD5', // Bianco
      U: '#0E68AB', // Blu
      B: '#150B00', // Nero
      R: '#D3202A', // Rosso
      G: '#00733E', // Verde
    };

    return colorMap[colors[0]] || '#8B4513';
  };

  // Funzione di ricerca debounced
  const performSearch = useCallback(
    (query) => {
      if (query.length <= 1) {
        setAddResults([]);
        setIsSearching(false);
        return;
      }

      const lowerVal = query.toLowerCase();
      let results = [];

      results = scryfallFuse.search(query).map((r) => r.item);

      // Deduplica per nome
      const seen = new Set();
      const deduped = results.filter((card) => {
        const name = card.name.toLowerCase();
        if (seen.has(name)) return false;
        seen.add(name);
        return true;
      });

      // Se esiste un match esatto, lo mettiamo in cima
      const exactMatch = scryfallData.find((card) => card.name.toLowerCase() === lowerVal);

      if (exactMatch) {
        const alreadyIn = deduped.find((card) => card.name.toLowerCase() === lowerVal);
        if (!alreadyIn) deduped.unshift(exactMatch);
        else {
          const filtered = deduped.filter((c) => c.name.toLowerCase() !== lowerVal);
          deduped.splice(0, deduped.length, exactMatch, ...filtered);
        }
      }

      setAddResults(deduped.slice(0, 10));
      setIsSearching(false);
    },
    [scryfallFuse]
  );

  // Handler per l'input con debounce
  const handleAddQueryChange = useCallback(
    (value) => {
      setAddQuery(value);

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      const trimmedValue = value.trim();
      if (trimmedValue.length <= 1) {
        setAddResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(trimmedValue);
      }, 300);
    },
    [performSearch]
  );

  // Cleanup del timeout al dismount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Effect per gestire il click outside
  // Effect per gestire il click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addBarRef.current && !addBarRef.current.contains(event.target)) {
        // Pulisci tutto quando clicchi fuori
        setAddResults([]);
        setIsSearching(false);
        setAddQuery(''); // Aggiungi questa riga per pulire anche l'input

        // Pulisci anche il timeout pendente se esiste
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }
      }
    };

    if (addResults.length > 0 || isSearching || addQuery.trim().length > 0) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [addResults.length, isSearching, addQuery]); // Aggiungi addQuery alle dipendenze

  const addCardToCollection = async (cardName) => {
    const lowerName = cardName.toLowerCase();
    const already = collection.find((c) => c.name.toLowerCase() === lowerName);
    const newQty = already ? already.qty + 1 : 1;

    await patchCard(cardName, newQty);

    // Mostra toast personalizzato
    showTempMessage(`✅ Aggiunto 1x ${capitalizeWords(cardName)} (ora ne hai ${newQty}x)`);

    // Evidenzia la carta nella griglia
    setHighlightedCard(lowerName);
    setTimeout(() => setHighlightedCard(''), 1000);

    setAddQuery('');
    setAddResults([]);
    setIsSearching(false);
  };

  // Funzione per ottenere la quantità posseduta di una carta
  const getOwnedQuantity = (cardName) => {
    const owned = collection.find((c) => c.name.toLowerCase() === cardName.toLowerCase());
    return owned ? owned.qty : 0;
  };

  const capitalizeWords = (str) => str.replace(/\b\w/g, (char) => char.toUpperCase());

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.txt')) return;

    setLoading(true);
    const text = await file.text();
    const parsed = parseCollectionFromText(text);
    const entries = Object.entries(parsed).map(([name, qty]) => ({ name, qty }));

    const enriched = entries.map((entry) => {
      const match = scryfallData.find(
        (card) => card.name.toLowerCase() === entry.name.toLowerCase()
      );
      return {
        ...entry,
        name: capitalizeWords(entry.name),
        image: match?.image || '',
        price: typeof match?.price === 'number' ? match.price : null,
        colors: match?.colors || [],
        type: match?.type || '',
      };
    });

    try {
      const response = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${await response.text()}`);
      }

      console.log('✅ Collezione salvata nel backend');
    } catch (error) {
      console.error('❌ Errore nel salvataggio:', error);
    }

    setCollection(enriched);
    setLoading(false);
  };

  const fuse = new Fuse(collection, {
    keys: ['name'],
    threshold: 0.3,
  });

  const searchResults = searchQuery
    ? fuse.search(searchQuery).map((result) => result.item)
    : collection;

  const filteredCollection = searchResults.filter((card) => {
    const colorMatch =
      !filterColor ||
      (filterColor === 'C' ? card.colors.length === 0 : card.colors.includes(filterColor));
    return colorMatch;
  });

  const loadMore = () => setVisibleCount((prev) => prev + 100);

  const totalValue = filteredCollection.reduce(
    (sum, card) => sum + (card.price ? card.price * card.qty : 0),
    0
  );

  const handleTypeSort = () => {
    const typePriority = [
      'creature',
      'planeswalker',
      'sorcery',
      'instant',
      'artifact',
      'enchantment',
      'land',
    ];
    const sorted = [...filteredCollection].sort((a, b) => {
      const getPriority = (type) => {
        const lower = type.toLowerCase();
        for (let i = 0; i < typePriority.length; i++) {
          if (lower.includes(typePriority[i])) return i;
        }
        return typePriority.length;
      };
      return getPriority(a.type) - getPriority(b.type);
    });
    setCollection(sorted);
  };

  const handleNameSort = () => {
    const sorted = [...filteredCollection].sort((a, b) => a.name.localeCompare(b.name));
    setCollection(sorted);
  };

  const handlePriceSort = () => {
    const sorted = [...filteredCollection].sort((a, b) => {
      const priceA = a.price ?? 0;
      const priceB = b.price ?? 0;
      return priceB - priceA;
    });
    setCollection(sorted);
  };

  const showTempMessage = (message, duration = 3000) => {
    setNotification(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), duration);
  };

  const patchCard = async (name, newQty) => {
    try {
      const response = await fetch('/api/collection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, qty: newQty }),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${await response.text()}`);
      }

      setCollection((prev) => {
        if (newQty <= 0) {
          return prev.filter((c) => c.name.toLowerCase() !== name.toLowerCase());
        } else {
          return prev.map((c) =>
            c.name.toLowerCase() === name.toLowerCase() ? { ...c, qty: newQty } : c
          );
        }
      });
      showTempMessage('✅ Salvato!');
    } catch (err) {
      console.error('❌ Errore PATCH:', err);
      showTempMessage('❌ Errore salvataggio');
    }
  };

  return (
    <div className="tab-collection">
      {collection.length === 0 && (
        <>
          <input type="file" accept=".txt" onChange={handleFileUpload} />
          {loading && <p>⏳ Caricamento in corso...</p>}
        </>
      )}

      {!loading && collection.length > 0 && (
        <>
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔎 Cerca una carta della tua collezione..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filters">
            <label>
              🎨 Colore:
              <select value={filterColor} onChange={(e) => setFilterColor(e.target.value)}>
                <option value="">Tutti</option>
                <option value="W">⚪ Bianco</option>
                <option value="U">🔵 Blu</option>
                <option value="B">⚫ Nero</option>
                <option value="R">🔴 Rosso</option>
                <option value="G">🟢 Verde</option>
                <option value="C">🟤 Incolore</option>
              </select>
            </label>
            <button onClick={handleTypeSort}>🔀 Ordina per Tipo</button>
            <button onClick={handleNameSort}>🔠 Ordina per Nome</button>
            <button onClick={handlePriceSort}>💶 Ordina per Prezzo</button>
          </div>
          <div className="add-bar" ref={addBarRef}>
            <div className="add-input-container">
              <input
                type="text"
                placeholder="➕ Aggiungi una carta alla tua collezione..."
                value={addQuery}
                onChange={(e) => handleAddQueryChange(e.target.value)}
              />
            </div>
            {isSearching && <span className="search-indicator">🔎 Cerco...</span>}
            {!isSearching && addResults.length === 0 && addQuery.trim().length > 1 && (
              <div className="no-results">❌ Nessun risultato</div>
            )}
            {addResults.length > 0 && (
              <ul className="add-dropdown">
                {addResults.map((card) => {
                  const ownedQty = getOwnedQuantity(card.name);
                  return (
                    <li key={card.name} onClick={() => addCardToCollection(card.name)}>
                      <img src={card.image} alt={card.name} className="dropdown-image" />
                      <div className="dropdown-info">
                        <span className="card-name">➕ {card.name}</span>
                        {ownedQty > 0 && (
                          <span className="owned-qty">(ne possiedi: {ownedQty})</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <p className="total-value">💰 Valore filtrato: {totalValue.toFixed(2)} €</p>
        </>
      )}

      <div className="collection-grid">
        {filteredCollection.slice(0, visibleCount).map((card, idx) => (
          <div
            key={idx}
            className={`card-box ${highlightedCard === card.name.toLowerCase() ? 'highlighted' : ''}`}
            style={{
              borderColor: getCardBorderColor(card.colors),
              borderWidth: '3px',
              borderStyle: 'solid',
            }}
          >
            <img src={card.image} alt={card.name} />
            <p>
              <strong>{card.name}</strong>
            </p>
            <div className="qty-controls">
              <button onClick={() => patchCard(card.name, card.qty - 1)}>➖</button>
              <span>📦 {card.qty}</span>
              <button onClick={() => patchCard(card.name, card.qty + 1)}>➕</button>
              <button onClick={() => patchCard(card.name, 0)} className="delete-btn">
                🗑️
              </button>
            </div>
            <p>💶 {typeof card.price === 'number' ? `${card.price.toFixed(2)} €` : 'N/A'}</p>
          </div>
        ))}
      </div>

      {visibleCount < filteredCollection.length && (
        <button className="load-more" onClick={loadMore}>
          Carica altre
        </button>
      )}
      {showNotification && <div className="notification-toast">{notification}</div>}
    </div>
  );
}

export default TabCollection;
