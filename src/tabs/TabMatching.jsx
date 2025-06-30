import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useDecks } from '../context/useDecks';
import DeckCard from '../components/DeckCard';
import useScryfall from '../hooks/useScryfall';
import DeckDetails from '../components/DeckDetails';
import CardViewer from '../components/CardViewer';
import useViewerCard from '../hooks/useViewerCard';
import '../styles/TabMatching.css';

function TabMatching() {
  const { decks, collection, loadingDecks } = useDecks();
  const scryfallData = useScryfall();
  const [minCompletion, setMinCompletion] = useState(80);
  const [matchingDecks, setMatchingDecks] = useState([]);
  const [visibleCount, setVisibleCount] = useState(24);
  const [isMatching, setIsMatching] = useState(false);
  const [expandedCommanders, setExpandedCommanders] = useState(new Set());
  const [openDrawerDeck, setOpenDrawerDeck] = useState(null);
  const [hideOwned, setHideOwned] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const drawerRef = useRef();
  const scrollPositionRef = useRef(0);
  const [searchCommanderQuery, setSearchCommanderQuery] = useState('');

  const viewerCard = useViewerCard(selectedCard);

  const PLACEHOLDER_IMAGE =
    'https://cards.scryfall.io/art_crop/front/0/0/0000579f-7b35-4ed3-b44c-db2a538066fe.jpg';

  // Pre-calcola la mappa della collezione con ottimizzazioni
  const collectionMap = useMemo(() => {
    if (!collection?.length) return new Map();

    const map = new Map();
    collection.forEach((card) => {
      if (card.name) {
        const name = card.name.toLowerCase();
        const qty = card.quantity || card.qty || 1;
        map.set(name, (map.get(name) || 0) + qty);
      }
    });
    return map;
  }, [collection]);

  // Pre-calcola la mappa di Scryfall con ottimizzazioni
  const scryfallMap = useMemo(() => {
    const map = new Map();
    scryfallData.forEach((card) => {
      if (card.name) {
        map.set(card.name.toLowerCase(), card.image || PLACEHOLDER_IMAGE);
      }
    });
    return map;
  }, [scryfallData]);

  // Funzione ottimizzata per il matching ultra-veloce
  const processDecksUltraFast = useCallback(
    async (decks, collectionMap, scryfallMap, minCompletion) => {
      const results = [];
      const BATCH_SIZE = 500;

      for (let i = 0; i < decks.length; i += BATCH_SIZE) {
        const batch = decks.slice(i, i + BATCH_SIZE);

        batch.forEach((deck) => {
          if (!deck?.cards?.length) return;

          let totalRequired = 0;
          let totalOwned = 0;
          let commanderCard = null;

          deck.cards.forEach((card) => {
            if (!card.name) return;

            if (card.isCommander) {
              commanderCard = card;
            }

            const name = card.name.toLowerCase();
            const requiredQty = card.quantity || 1;
            const ownedQty = collectionMap.get(name) || 0;

            totalRequired += requiredQty;
            totalOwned += Math.min(requiredQty, ownedQty);
          });

          if (totalRequired === 0) return;

          const completion = Math.round((totalOwned / totalRequired) * 100);

          if (completion >= minCompletion) {
            if (!commanderCard) {
              commanderCard = deck.cards[0];
            }

            const commanderImage =
              scryfallMap.get(commanderCard.name.toLowerCase()) || PLACEHOLDER_IMAGE;

            results.push({
              ...deck,
              completion,
              commanderName: commanderCard.name,
              commanderImage,
            });
          }
        });

        if (i % 2000 === 0 && i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 5));
        }
      }

      return results.sort((a, b) => b.completion - a.completion);
    },
    []
  );

  // Raggruppa i deck per commander
  const groupedByCommander = useMemo(() => {
    const filtered = matchingDecks.filter((deck) => deck.completion >= minCompletion);
    const groups = new Map();

    filtered.forEach((deck) => {
      const commanderName = deck.commanderName;
      if (!groups.has(commanderName)) {
        groups.set(commanderName, {
          commanderName,
          commanderImage: deck.commanderImage,
          decks: [],
          maxCompletion: 0,
          avgCompletion: 0,
        });
      }

      const group = groups.get(commanderName);
      group.decks.push(deck);
      group.maxCompletion = Math.max(group.maxCompletion, deck.completion);
    });

    // Calcola la media di completamento per ogni gruppo
    groups.forEach((group) => {
      const totalCompletion = group.decks.reduce((sum, deck) => sum + deck.completion, 0);
      group.avgCompletion = Math.round(totalCompletion / group.decks.length);
    });

    // Converti in array e ordina per massimo completamento
    return Array.from(groups.values()).sort((a, b) => b.maxCompletion - a.maxCompletion);
  }, [matchingDecks, minCompletion]);

  const handleMatch = async () => {
    if (!collection?.length) {
      alert("⚠️ Collezione non caricata. Vai prima nella tab 'Collezione' e carica il file .txt.");
      return;
    }

    if (collectionMap.size === 0) {
      alert('⚠️ Collezione vuota o non valida.');
      return;
    }

    setIsMatching(true);
    setMatchingDecks([]);
    setExpandedCommanders(new Set());

    const startTime = performance.now();

    try {
      const results = await processDecksUltraFast(decks, collectionMap, scryfallMap, minCompletion);
      setMatchingDecks(results);
      setVisibleCount(24);

      const endTime = performance.now();
      console.log(
        `Matching completato in ${Math.round(endTime - startTime)}ms per ${decks.length} deck`
      );
    } catch (error) {
      console.error('Errore durante il matching:', error);
      alert('Errore durante il matching. Controlla la console per i dettagli.');
    } finally {
      setIsMatching(false);
    }
  };

  const toggleCommander = (commanderName) => {
    const newExpanded = new Set(expandedCommanders);
    if (newExpanded.has(commanderName)) {
      newExpanded.delete(commanderName);
    } else {
      newExpanded.add(commanderName);
    }
    setExpandedCommanders(newExpanded);
  };

  const loadMore = () => setVisibleCount((prev) => prev + 24);

  const filteredGroups = useMemo(() => {
    if (!searchCommanderQuery.trim()) return groupedByCommander;
    const query = searchCommanderQuery.toLowerCase();
    return groupedByCommander.filter((group) => group.commanderName.toLowerCase().includes(query));
  }, [groupedByCommander, searchCommanderQuery]);
  const visibleGroups = filteredGroups.slice(0, visibleCount);
  const totalDecksFound = groupedByCommander.reduce((sum, group) => sum + group.decks.length, 0);

  // Chiudi drawer al click fuori
  useEffect(() => {
    if (!openDrawerDeck) return;
    const handleClick = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setOpenDrawerDeck(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openDrawerDeck]);

  // Gestione scroll quando si apre il drawer
  useEffect(() => {
    if (openDrawerDeck) {
      scrollPositionRef.current = window.scrollY;
      const drawerElement = drawerRef.current;
      if (drawerElement) {
        const rect = drawerElement.getBoundingClientRect();
        const scrollTo = window.scrollY + rect.top - 50; // 50px di margine
        window.scrollTo({ top: scrollTo, behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: scrollPositionRef.current, behavior: 'smooth' });
    }
  }, [openDrawerDeck]);

  // Esporta mancanti già esiste
  const buildLines = (deck) => deck.cards.map((c) => `${c.quantity || 1} ${c.name}`);

  const handleExportList = (deck) => {
    const lines = buildLines(deck);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleCopyList = async (deck) => {
    try {
      await navigator.clipboard.writeText(buildLines(deck).join('\n'));
      alert('Lista copiata negli appunti!');
    } catch {
      alert('Errore nella copia');
    }
  };

  const handleExportMissing = (missingCards) => {
    const txt = missingCards.map((c) => `${c.quantity - (c.owned || 0)} ${c.name}`).join('\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'missing_cards.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div className="tab-matching">
      <div className="matching-header">
        <h2>🎯 Deck Matching</h2>
        <p className="subtitle">Trova i deck che puoi costruire con la tua collezione</p>
      </div>

      <div className="matching-controls">
        <div className="control-group">
          <label className="range-label">
            <span>
              Completamento minimo: <strong>{minCompletion}%</strong>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={minCompletion}
              onChange={(e) => setMinCompletion(Number(e.target.value))}
              disabled={isMatching}
              className="completion-slider"
            />
          </label>
        </div>

        <button
          onClick={handleMatch}
          disabled={isMatching || !collection?.length || loadingDecks}
          className={`match-button ${isMatching ? 'matching' : ''}`}
        >
          {isMatching ? (
            <>
              <span className="spinner"></span>
              Matching...
            </>
          ) : (
            <>
              <span>🚀</span>
              Avvia Matching
            </>
          )}
        </button>
      </div>

      <div className="search-commander">
        <input
          type="text"
          placeholder="🔍 Cerca un comandante..."
          value={searchCommanderQuery}
          onChange={(e) => setSearchCommanderQuery(e.target.value)}
          disabled={groupedByCommander.length === 0}
        />
      </div>

      {isMatching && (
        <div className="matching-progress">
          <p>🔍 Analizzando {decks.length.toLocaleString()} deck...</p>
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>
      )}

      {groupedByCommander.length > 0 && (
        <div className="matching-stats">
          <div className="stat">
            <span className="stat-number">{groupedByCommander.length}</span>
            <span className="stat-label">Commander</span>
          </div>
          <div className="stat">
            <span className="stat-number">{totalDecksFound}</span>
            <span className="stat-label">Deck trovati</span>
          </div>
          <div className="stat">
            <span className="stat-number">{minCompletion}%+</span>
            <span className="stat-label">Completamento</span>
          </div>
        </div>
      )}

      <div className="commander-groups">
        {visibleGroups.map((group) => (
          <div key={group.commanderName} className="commander-group">
            <div
              className={`commander-header ${expandedCommanders.has(group.commanderName) ? 'expanded' : ''}`}
              onClick={() => toggleCommander(group.commanderName)}
            >
              <div className="commander-info">
                <img
                  src={group.commanderImage}
                  alt={group.commanderName}
                  className="commander-image"
                  onError={(e) => {
                    e.target.src = PLACEHOLDER_IMAGE;
                  }}
                />
                <div className="commander-details">
                  <h3 className="commander-name">{group.commanderName}</h3>
                  <div className="commander-stats">
                    <span className="deck-count">
                      {group.decks.length} deck{group.decks.length > 1 ? 's' : ''}
                    </span>
                    <span className="completion-range">
                      {group.decks.length === 1
                        ? `${group.maxCompletion}%`
                        : `${Math.min(...group.decks.map((d) => d.completion))}% - ${group.maxCompletion}%`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="expand-indicator">
                {expandedCommanders.has(group.commanderName) ? '▼' : '▶'}
              </div>
            </div>

            {expandedCommanders.has(group.commanderName) && (
              <div className="commander-decks">
                <div className="deck-grid">
                  {group.decks.map((deck, index) => (
                    <div
                      key={`${deck.name}-${index}`}
                      className="deck-card"
                      onClick={() => setOpenDrawerDeck(deck)}
                      style={{ cursor: 'pointer' }}
                    >
                      <DeckCard deck={deck} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {visibleCount < groupedByCommander.length && (
        <div className="load-more-section">
          <button onClick={loadMore} className="load-more-btn">
            <span>📋</span>
            Carica altri commander
            <span className="load-more-count">
              ({visibleCount} di {groupedByCommander.length})
            </span>
          </button>
        </div>
      )}

      {loadingDecks ? (
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <h3>Caricamento mazzi in corso...</h3>
          <p>Attendi qualche secondo prima di avviare il matching</p>
        </div>
      ) : (
        groupedByCommander.length === 0 &&
        !isMatching &&
        matchingDecks.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎴</div>
            <h3>Nessun deck analizzato</h3>
            <p>Clicca "Avvia Matching" per trovare i deck che puoi costruire</p>
          </div>
        )
      )}

      {groupedByCommander.length === 0 && !isMatching && matchingDecks.length > 0 && (
        <div className="no-results">
          <div className="no-results-icon">😔</div>
          <h3>Nessun deck trovato</h3>
          <p>Prova ad abbassare la soglia di completamento minimo</p>
        </div>
      )}

      {/* Drawer Bubble */}
      {openDrawerDeck && (
        <div className="deck-drawer-overlay">
          <div className="deck-drawer-bubble" ref={drawerRef}>
            <button className="drawer-close-btn" onClick={() => setOpenDrawerDeck(null)}>
              ✕
            </button>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#fff', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={hideOwned}
                  onChange={(e) => setHideOwned(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Nascondi già possedute
              </label>
            </div>
            <DeckDetails
              deck={openDrawerDeck}
              collection={collection}
              hideOwned={hideOwned}
              onExportMissing={handleExportMissing}
              onCopyList={handleCopyList}
              onExportList={handleExportList}
              onCardClick={(card) => setSelectedCard(card)}
            />
          </div>
        </div>
      )}
      {viewerCard && <CardViewer card={viewerCard} onClose={() => setSelectedCard(null)} />}
    </div>
  );
}

export default TabMatching;
