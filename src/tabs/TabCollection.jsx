// TabCollection.jsx
import React, { useEffect, useState, useRef } from 'react';
import '../styles/TabCollection.css';
import useScryfall from '../hooks/useScryfall';
import Fuse from 'fuse.js';
import { useDecks } from '../context/useDecks';
import CollectionImport from '../components/CollectionImport';
import CollectionImportModal from '../components/CollectionImportModal';
import Toast from '../components/Toast';
import CardViewer from '../components/CardViewer';
import CollectionAddSearch from '../components/CollectionAddSearch';
import capitalizeWords from '../utils/capitalizeWords';
import useViewerCard from '../hooks/useViewerCard';

function TabCollection() {
  const { collection, setCollection } = useDecks();
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [filterColor, setFilterColor] = useState('');
  const [setNotification] = useState('');
  const [setShowNotification] = useState(false);
  const scryfallData = useScryfall();
  const [selectedCard, setSelectedCard] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const scrollPositionRef = useRef(0);
  const importModalRef = useRef(null);

  // Posizione scroll quando si aprono i modali

  const addCardToCollection = async (cardName) => {
    const lowerName = cardName.toLowerCase();
    const already = collection.find((c) => c.name.toLowerCase() === lowerName);
    const newQty = already ? already.qty + 1 : 1;

    const ok = await patchCard(cardName, newQty, { silent: true });
    if (!ok) {
      showTempMessage(`❌ Carta non trovata: ${capitalizeWords(cardName)}`);
      return;
    }
  };
  const handleImportFromText = (text) => {
    setImportText(text);
    setImportModalOpen(true);
  };

  const fuse = new Fuse(collection, {
    keys: ['name'],
    threshold: 0.3,
  });

  const searchResultsRaw = searchQuery
    ? fuse.search(searchQuery).map((result) => result.item)
    : collection;
  const searchResults = Array.isArray(searchResultsRaw) ? searchResultsRaw : [];

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
    const sorted = [...filteredCollection].sort((a, b) => (b.price || 0) - (a.price || 0));
    setCollection(sorted);
  };

  const showTempMessage = (message, duration = 3000) => {
    setNotification(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), duration);
  };

  const addCardsFromModal = async (cards) => {
    setImportModalOpen(false);
    setLoading(true);
    try {
      for (const { name, qty } of cards) {
        const current = collection.find((c) => c.name.toLowerCase() === name.toLowerCase());
        const newQty = (current ? current.qty : 0) + qty;
        await patchCard(name, newQty, { silent: true });
      }
      showTempMessage(`✅ ${cards.length} carte importate con successo!`);
    } catch (err) {
      console.error('Errore import aggiunta:', err);
      showTempMessage("❌ Errore durante l'import", 5000);
    } finally {
      setLoading(false);
    }
  };

  const overwriteCollection = async (cards) => {
    setImportModalOpen(false);
    setLoading(true);
    try {
      const response = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cards),
      });
      if (!response.ok) throw new Error();
      const enriched = cards.map((entry) => {
        const match = scryfallData.find((c) => c.name.toLowerCase() === entry.name.toLowerCase());
        return {
          ...entry,
          image: match?.image || '',
          price: typeof match?.price === 'number' ? match.price : null,
          colors: match?.colors || [],
          type: match?.type || '',
        };
      });
      setCollection(enriched);
      showTempMessage('✅ Collezione sovrascritta');
    } catch (err) {
      console.error('Errore sovrascrittura:', err);
      showTempMessage('❌ Errore sovrascrittura', 5000);
    } finally {
      setLoading(false);
    }
  };

  const patchCardData = async (data, { silent = false } = {}) => {
    const match = scryfallData.find((c) => c.name.toLowerCase() === data.name.toLowerCase());
    if (!match) {
      if (!silent) {
        showTempMessage(`❌ Carta non valida: ${capitalizeWords(data.name)}`);
      }
      return false;
    }
    try {
      const response = await fetch('/api/collection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, name: match.name }),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${await response.text()}`);
      }

      setCollection((prev) => {
        const index = prev.findIndex((c) => c.name.toLowerCase() === match.name.toLowerCase());
        const base = {
          name: match.name,
          image: data.image || match.image || '',
          price:
            typeof data.price === 'number'
              ? data.price
              : typeof match.price === 'number'
                ? match.price
                : null,
          colors: match.colors || [],
          type: match.type || '',
        };
        if (data.qty !== undefined && data.qty <= 0) {
          return prev.filter((c) => c.name.toLowerCase() !== match.name.toLowerCase());
        }

        if (index !== -1) {
          return prev.map((c, i) => (i === index ? { ...c, ...base, ...data } : c));
        }
        return [...prev, { ...base, ...data }];
      });
      if (selectedCard && selectedCard.name.toLowerCase() === match.name.toLowerCase()) {
        setSelectedCard((prev) =>
          prev
            ? { ...prev, ...data, image: data.image || prev.image, price: data.price ?? prev.price }
            : prev
        );
      }
      if (!silent) {
        showTempMessage('✅ Salvato!');
      }
      return true;
    } catch (err) {
      console.error('❌ Errore PATCH:', err);
      if (!silent) {
        showTempMessage('❌ Errore salvataggio');
      }
      return false;
    }
  };
  const patchCard = (name, newQty, opts) => patchCardData({ name, qty: newQty }, opts);
  const clearCollection = async () => {
    if (!window.confirm('Svuotare tutta la collezione?')) return;
    try {
      const response = await fetch('/api/collection', { method: 'DELETE' });
      if (!response.ok) throw new Error();
      setCollection([]);
      showTempMessage('✅ Collezione svuotata');
    } catch (err) {
      console.error('❌ Errore durante lo svuotamento:', err);
      showTempMessage('❌ Errore svuotamento');
    }
  };
  // Gestione scroll quando si apre il modale
  useEffect(() => {
    if (selectedCard) {
      scrollPositionRef.current = window.scrollY;
    } else if (!importModalOpen) {
      window.scrollTo({ top: scrollPositionRef.current, behavior: 'smooth' });
    }
  }, [selectedCard, importModalOpen]);

  // Gestione scroll per il modale di importazione collezione
  useEffect(() => {
    if (importModalOpen) {
      scrollPositionRef.current = window.scrollY;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (!selectedCard) {
      window.scrollTo({ top: scrollPositionRef.current, behavior: 'smooth' });
    }
  }, [importModalOpen, selectedCard]);
  // Ripristina la posizione dello scroll quando la collezione filtrata cambia
  useEffect(() => {
    if (scrollPositionRef.current) {
      window.scrollTo(0, scrollPositionRef.current);
    }
  }, [filteredCollection]);

  // Salva la posizione dello scroll prima di un re-render
  const handleScroll = () => {
    scrollPositionRef.current = window.scrollY;
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const viewerCard = useViewerCard(selectedCard);

  return (
    <div className="tab-collection">
      <div className="collection-controls">
        <div className="top-controls">
          <CollectionAddSearch onAddCard={addCardToCollection} collection={collection} />
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔎 Cerca nella collezione..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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

        <CollectionImport onImport={handleImportFromText} />
        {importModalOpen && (
          <CollectionImportModal
            ref={importModalRef}
            initialText={importText}
            onCancel={() => setImportModalOpen(false)}
            onAdd={addCardsFromModal}
            onOverwrite={overwriteCollection}
          />
        )}
        <button onClick={clearCollection}>🧹 Svuota Collezione</button>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>⏳ Caricamento in corso...</p>
        </div>
      ) : (
        <>
          {collection.length === 0 ? (
            <div className="empty-collection-placeholder">
              <h2>La tua collezione è vuota</h2>
              <p>Aggiungi carte usando la barra di ricerca o importa una lista.</p>
            </div>
          ) : (
            <>
              {filteredCollection.length > 0 && (
                <div className="collection-summary">
                  <p>
                    Trovate <strong>{filteredCollection.length}</strong> carte uniche (su{' '}
                    {collection.length} totali)
                  </p>
                  <p className="total-value">💰 Valore filtrato: {totalValue.toFixed(2)} €</p>
                </div>
              )}
              <div className="collection-grid">
                {filteredCollection.slice(0, visibleCount).map((card, index) => (
                  <div key={index} className="card-box" onClick={() => setSelectedCard(card)}>
                    {card.image && (
                      <img
                        src={card.image.replace('/small/', '/normal/')}
                        alt={card.name}
                        className="card-image"
                        loading="lazy"
                      />
                    )}
                    <div className="card-info">
                      <p className="card-name">{card.name}</p>
                      <p className="card-type">{card.type}</p>
                      <div className="qty-controls">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            patchCard(card.name, card.qty - 1);
                          }}
                        >
                          ➖
                        </button>
                        <span>📦 {card.qty}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            patchCard(card.name, card.qty + 1);
                          }}
                        >
                          ➕
                        </button>
                      </div>
                      <p className="card-price">
                        {card.price ? `€ ${card.price.toFixed(2)}` : '--€'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {visibleCount < filteredCollection.length && (
                <button onClick={loadMore} className="load-more-btn">
                  Carica Altri
                </button>
              )}
            </>
          )}
        </>
      )}
      {viewerCard && (
        <CardViewer
          card={viewerCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={patchCardData}
        />
      )}
    </div>
  );
}

export default TabCollection;

