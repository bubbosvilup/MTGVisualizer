// TabCollection.jsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import '../styles/TabCollection.css';
import scryfallData from '../data/scryfall-min.json';
import Fuse from 'fuse.js';
import { useDecks } from '../context/useDecks';
import CollectionImport from '../components/CollectionImport';
import CollectionImportModal from '../components/CollectionImportModal';
import Toast from '../components/Toast';

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
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardDetails, setCardDetails] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const modalRef = useRef();
  const scrollPositionRef = useRef(0);
  const importModalRef = useRef(null);
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

    const ok = await patchCard(cardName, newQty, { silent: true });
    if (!ok) {
      showTempMessage(`❌ Carta non trovata: ${capitalizeWords(cardName)}`);
      return;
    }

    // Mostra toast personalizzato
    showTempMessage(`✅ Aggiunto 1x ${capitalizeWords(cardName)} (ora ne hai ${newQty}x)`);

    setAddQuery('');
    setAddResults([]);
    setIsSearching(false);
  };

  // Funzione per ottenere la quantità posseduta di una carta
  const getOwnedQuantity = (cardName) => {
    const owned = collection.find((c) => c.name.toLowerCase() === cardName.toLowerCase());
    return owned ? owned.qty : 0;
  };

  // Funzione per capitalizzare ogni parola
  const capitalizeWords = (str) => str.replace(/\b\w/g, (char) => char.toUpperCase());

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

  const patchCard = async (name, newQty, { silent = false } = {}) => {
    if (newQty < 0) newQty = 0;
    const match = scryfallData.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (!match) {
      if (!silent) {
        showTempMessage(`❌ Carta non valida: ${capitalizeWords(name)}`);
      }
      return false;
    }
    try {
      const response = await fetch('/api/collection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: match.name, qty: newQty }),
      });

      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${await response.text()}`);
      }

      setCollection((prev) => {
        if (newQty <= 0) {
          return prev.filter((c) => c.name.toLowerCase() !== match.name.toLowerCase());
        }
        const base = {
          name: match.name,
          image: match.image || '',
          price: typeof match.price === 'number' ? match.price : null,
          colors: match.colors || [],
          type: match.type || '',
        };
        const index = prev.findIndex((c) => c.name.toLowerCase() === match.name.toLowerCase());
        if (index !== -1) {
          return prev.map((c, i) => (i === index ? { ...c, qty: newQty, ...base } : c));
        }
        return [...prev, { ...base, qty: newQty }];
      });
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
      const modalElement = modalRef.current;
      if (modalElement) {
        const rect = modalElement.getBoundingClientRect();
        const scrollTo = window.scrollY + rect.top - 50; // 50px di margine
        window.scrollTo({ top: scrollTo, behavior: 'smooth' });
      }
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
  // Fetch dettagli carta da CardTrader
  useEffect(() => {
    if (!selectedCard) return;
    const fetchCardDetails = async () => {
      try {
        const res = await fetch(`/api/cardtrader/${selectedCard.name}`);
        if (!res.ok) {
          setCardDetails({ error: true });
          return;
        }
        const data = await res.json();
        setCardDetails(data);
      } catch (err) {
        setCardDetails({ error: true });
        console.error('Errore nel caricamento dei dettagli della carta:', err);
      }
    };
    fetchCardDetails();
  }, [selectedCard]);

  // Chiudi modale al click fuori
  useEffect(() => {
    if (!selectedCard) return;
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setSelectedCard(null);
        setCardDetails(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [selectedCard]);

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

  return (
    <div className="tab-collection">
      <div className="collection-controls">
        <div className="top-controls">
          <div ref={addBarRef} className="add-bar-container">
            <div className="input-with-icon">
              <span className="icon-search"></span>
              <input
                type="text"
                value={addQuery}
                onChange={(e) => handleAddQueryChange(e.target.value)}
                placeholder="Aggiungi una carta..."
                className="add-card-input"
              />
            </div>
            {(isSearching || addResults.length > 0) && (
              <ul className="add-results-list">
                {isSearching ? (
                  <li className="searching-indicator">Ricerca...</li>
                ) : (
                  addResults.map((card) => {
                    const imgSrc = card.image_uris?.normal || card.image || null;
                    return (
                      <li key={card.id || card.name} onClick={() => addCardToCollection(card.name)}>
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
                        {card.price ? `€ ${card.price.toFixed(2)}` : 'N/A'}
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

      {selectedCard && (
        <div className="modal-overlay" onClick={() => setSelectedCard(null)}>
          <div ref={modalRef} className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedCard(null)}>
              ✖
            </button>
            <h2>{selectedCard.name}</h2>
            <div className="modal-body">
              {selectedCard.image && (
                <img
                  src={selectedCard.image.replace('/small/', '/normal/')}
                  alt={selectedCard.name}
                  className="modal-card-image"
                />
              )}
              <div className="modal-card-details">
                <p>
                  <strong>Tipo:</strong> {selectedCard.type}
                </p>
                {cardDetails?.mana_cost && (
                  <p>
                    <strong>Costo di Mana:</strong> {cardDetails.mana_cost}
                  </p>
                )}
                {cardDetails?.oracle_text && (
                  <p>
                    <strong>Testo Oracolo:</strong>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: cardDetails.oracle_text.replace(/\n/g, '<br />'),
                      }}
                    ></span>
                  </p>
                )}
                {cardDetails?.power && cardDetails?.toughness && (
                  <p>
                    <strong>Forza/Costituzione:</strong> {cardDetails.power}/{cardDetails.toughness}
                  </p>
                )}
                {cardDetails?.flavor_text && (
                  <p className="flavor-text">
                    <em>{cardDetails.flavor_text}</em>
                  </p>
                )}
                <a href={cardDetails?.scryfall_uri} target="_blank" rel="noopener noreferrer">
                  Vedi su Scryfall
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {showNotification && <Toast message={notification} />}
    </div>
  );
}

export default TabCollection;

