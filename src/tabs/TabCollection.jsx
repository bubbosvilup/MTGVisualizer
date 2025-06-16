// TabCollection.jsx
import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await fetch('/api/collection');
        const data = await res.json();

        const enriched = data.map((entry) => {
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

        console.log('📥 Collezione caricata da backend:', enriched);
        setCollection(enriched);
      } catch (err) {
        console.error('❌ Errore nel caricamento della collezione:', err);
      }
    };

    fetchCollection();
  }, [setCollection]);

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

  const showTempMessage = (message, duration = 2000) => {
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
              placeholder="🔎 Cerca una carta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filters">
            <label>
              🎨 Colore:
              <select value={filterColor} onChange={(e) => setFilterColor(e.target.value)}>
                <option value="">Tutti</option>
                <option value="W">Bianco</option>
                <option value="U">Blu</option>
                <option value="B">Nero</option>
                <option value="R">Rosso</option>
                <option value="G">Verde</option>
                <option value="C">Incolore</option>
              </select>
            </label>
            <button onClick={handleTypeSort}>🔀 Ordina per Tipo</button>
            <button onClick={handleNameSort}>🔠 Ordina per Nome</button>
            <button onClick={handlePriceSort}>💶 Ordina per Prezzo</button>
          </div>

          <p className="total-value">💰 Valore filtrato: {totalValue.toFixed(2)} €</p>
        </>
      )}

      <div className="collection-grid">
        {filteredCollection.slice(0, visibleCount).map((card, idx) => (
          <div key={idx} className="card-box">
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
