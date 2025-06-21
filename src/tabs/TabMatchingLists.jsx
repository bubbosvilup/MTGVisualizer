import React, { useState } from 'react';
import { useDecks } from '../context/useDecks';
import scryfallData from '../data/scryfall-min.json';
import '../styles/TabMatchingLists.css';

const CARDTRADER_API = 'https://api.cardtrader.com/api/v2/wishlists';
const TOKEN = import.meta.env.VITE_CARDTRADER_TOKEN;

function TabMatchingLists() {
  const { collection } = useDecks();
  const [deckListText, setDeckListText] = useState('');
  const [missingCards, setMissingCards] = useState([]);
  const [foundCards, setFoundCards] = useState([]);

  // Stati di loading
  const [isCreatingWishlist, setIsCreatingWishlist] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, currentCard: '' });

  const parseLine = (line) => {
    const match = line.match(/^(\d+)\s+(.+)$/);
    if (!match) return null;
    const qty = parseInt(match[1], 10);
    let rest = match[2].trim();
    // Taglia eventuale parentesi (set) o collector code alla fine
    rest = rest.replace(/\s+\([^)]*\).*$/, '');
    // Rimuovi eventuali codice collector tipo "(ONE) 123" o "E01-12" dopo nome
    rest = rest.replace(/\s+[A-Z]{2,}\d+$/i, '');
    return { name: rest.trim(), quantity: qty };
  };

  const normalizeForComparison = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9/ ]/g, '') // rimuove punteggiatura tranne /
      .replace(/\s+/g, ' ')
      .trim();

  const handleMatch = () => {
    const lines = deckListText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const parsed = {};
    for (const line of lines) {
      const result = parseLine(line);
      if (result) {
        const normalizedName = normalizeForComparison(result.name);
        if (!parsed[normalizedName]) {
          parsed[normalizedName] = { originalName: result.name, quantity: 0 };
        }
        parsed[normalizedName].quantity += result.quantity;
      }
    }

    const found = [];
    const missing = [];
    for (const [normalizedName, cardData] of Object.entries(parsed)) {
      const { originalName, quantity } = cardData;
      const ownedCard = collection.find((c) => normalizeForComparison(c.name) === normalizedName);
      const scryCard = scryfallData.find((c) => normalizeForComparison(c.name) === normalizedName);
      const image = scryCard?.image || '';
      const price = scryCard?.price || 0;

      if (ownedCard) {
        const owned = ownedCard.quantity;
        if (owned < quantity) {
          missing.push({ name: originalName, image, price, quantity, owned });
        } else {
          found.push({ name: originalName, image, price, quantity });
        }
      } else {
        missing.push({ name: originalName, image, price, quantity, owned: 0 });
      }
    }

    setFoundCards(found);
    setMissingCards(missing);
  };

  const totalMissingPrice = missingCards.reduce(
    (sum, card) => sum + card.price * (card.quantity - card.owned),
    0
  );

  const exportMissingAsTxt = () => {
    const lines = missingCards.map((card) => {
      const needed = card.quantity - card.owned;
      return `${needed}x ${card.name}`;
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'carte_mancanti.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const createWishlistOnCardTrader = async () => {
    if (!TOKEN || TOKEN.trim() === '') {
      alert('Token CardTrader non configurato. Verifica il file .env');
      return;
    }

    setIsCreatingWishlist(true);
    setLoadingProgress({ current: 0, total: missingCards.length, currentCard: '' });

    console.log('🔑 Token presente:', TOKEN ? 'SI' : 'NO');

    const items = [];
    const invalidCards = [];

    for (let i = 0; i < missingCards.length; i++) {
      const card = missingCards[i];
      const needed = card.quantity - card.owned;
      const cleanName = card.name.split('//')[0].trim();

      // Aggiorna progress
      setLoadingProgress({
        current: i + 1,
        total: missingCards.length,
        currentCard: cleanName,
      });

      const match = scryfallData.find(
        (c) => normalizeForComparison(c.name) === normalizeForComparison(cleanName)
      );

      if (!match || !match.set || !match.collector_number) {
        invalidCards.push(cleanName);
        continue;
      }

      try {
        const query = `https://api.cardtrader.com/api/v2/blueprints?name=${encodeURIComponent(match.name)}`;
        console.log('🔍 Cerco blueprint per:', match.name);

        const res = await fetch(query, {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          console.error(`❌ Errore fetch blueprint ${res.status}:`, await res.text());
          invalidCards.push(cleanName);
          continue;
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          console.error('❌ Risposta API non è un array:', data);
          invalidCards.push(cleanName);
          continue;
        }

        const blueprint =
          data.length === 1
            ? data[0]
            : data.find((b) => b.name?.toLowerCase() === match.name.toLowerCase());

        if (!blueprint) {
          console.warn(
            `⚠️ Blueprint non trovato per ${cleanName} (set: ${match.set}, num: ${match.collector_number})`
          );
          invalidCards.push(cleanName);
          continue;
        }

        console.log('✅ Blueprint trovato:', blueprint.id, 'per', cleanName);
        items.push({ blueprint_id: blueprint.id, quantity: needed });
      } catch (err) {
        console.error(`❌ Errore fetch blueprint per ${cleanName}:`, err);
        invalidCards.push(cleanName);
      }
    }

    if (items.length === 0) {
      setIsCreatingWishlist(false);
      alert('Nessuna carta valida trovata per creare la wishlist');
      return;
    }

    console.log('📦 Items per wishlist:', items);
    console.warn('❌ Carte non trovate:', invalidCards);

    // Aggiorna progress per creazione wishlist
    setLoadingProgress({
      current: missingCards.length,
      total: missingCards.length,
      currentCard: 'Creazione wishlist...',
    });

    const body = {
      name: 'Wishlist da mtgVisualizer',
      public: false,
      game_id: 1,
      deck_items_attributes: items,
    };

    console.log('📤 Payload wishlist:', JSON.stringify(body, null, 2));

    try {
      const response = await fetch(CARDTRADER_API, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      console.log('📥 Risposta raw:', responseText);

      if (!response.ok) {
        console.error(`❌ Errore HTTP ${response.status}:`, responseText);

        if (response.status === 401) {
          alert('Errore 401: Token non valido o scaduto. Verifica il token CardTrader.');
        } else if (response.status === 422) {
          alert(`Errore 422: Dati non validi. Dettagli: ${responseText}`);
        } else {
          alert(`Errore ${response.status}: ${responseText}`);
        }
        return;
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Errore parsing JSON:', parseError);
        alert('Errore nel parsing della risposta del server');
        return;
      }

      console.log('✅ Wishlist creata:', data);

      if (confirm('✅ Wishlist creata con successo su CardTrader. Vuoi aprirla ora?')) {
        window.open(`https://www.cardtrader.com/my/wishlists/${data.id}`, '_blank');
      }
    } catch (error) {
      console.error('❌ Errore generale:', error);
      alert('Errore nella creazione della wishlist: ' + error.message);
    } finally {
      setIsCreatingWishlist(false);
      setLoadingProgress({ current: 0, total: 0, currentCard: '' });
    }
  };

  return (
    <div className="tab-matching">
      <h2>📋 Match Lista Deck ↔ Collezione</h2>

      <textarea
        className="deck-link-input"
        rows={12}
        value={deckListText}
        onChange={(e) => setDeckListText(e.target.value)}
        placeholder="Incolla qui la lista del deck da Moxfield..."
      />

      <button className="button" onClick={handleMatch}>
        Confronta con la mia collezione
      </button>

      {(missingCards.length > 0 || foundCards.length > 0) && (
        <div className="summary-section">
          <div className="stats">
            <div className="stat">
              <div className="stat-number">{foundCards.length}</div>
              <div className="stat-label">Carte Possedute</div>
            </div>
            <div className="stat">
              <div className="stat-number">{missingCards.length}</div>
              <div className="stat-label">Carte Mancanti</div>
            </div>
            <div className="stat">
              <div className="stat-number">€{totalMissingPrice.toFixed(2)}</div>
              <div className="stat-label">Costo Mancanti</div>
            </div>
          </div>
        </div>
      )}

      {missingCards.length > 0 && (
        <div className="export-button-wrapper">
          <button className="button" onClick={exportMissingAsTxt}>
            📄 Esporta Mancanti in .txt
          </button>
          <button
            className={`button ${isCreatingWishlist ? 'loading' : ''}`}
            onClick={createWishlistOnCardTrader}
            disabled={isCreatingWishlist}
          >
            {isCreatingWishlist ? (
              <>
                <div className="loading-spinner"></div>
                Creazione in corso...
              </>
            ) : (
              <>📤 Crea Wishlist su CardTrader</>
            )}
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {isCreatingWishlist && (
        <div className="loading-overlay">
          <div className="loading-modal">
            <div className="loading-header">
              <h3>🚀 Creazione Wishlist</h3>
              <div className="loading-spinner-large"></div>
            </div>

            <div className="progress-section">
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                />
              </div>
              <div className="progress-text">
                {loadingProgress.current} / {loadingProgress.total} carte processate
              </div>
            </div>

            <div className="current-card">
              <div className="current-card-label">Elaborando:</div>
              <div className="current-card-name">{loadingProgress.currentCard}</div>
            </div>

            <div className="loading-steps">
              <div className={`step ${loadingProgress.current > 0 ? 'active' : ''}`}>
                🔍 Ricerca blueprints
              </div>
              <div
                className={`step ${loadingProgress.current >= loadingProgress.total ? 'active' : ''}`}
              >
                📤 Creazione wishlist
              </div>
            </div>
          </div>
        </div>
      )}

      {missingCards.length > 0 && (
        <div className="results-section">
          <h3>❌ Carte Mancanti ({missingCards.length})</h3>
          <div className="card-grid">
            {missingCards.map((card, index) => (
              <div className="card-box" key={`${card.name}-${index}`}>
                {card.image && <img src={card.image} alt={card.name} />}
                <div>
                  <strong>{card.name}</strong>
                </div>
                <div>
                  Serve: {card.quantity - card.owned} | Hai: {card.owned}
                </div>
                <div>💰 €{card.price}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {foundCards.length > 0 && (
        <div className="results-section">
          <h3>✅ Carte Possedute ({foundCards.length})</h3>
          <div className="card-grid">
            {foundCards.map((card, index) => (
              <div className="card-box" key={`${card.name}-${index}`}>
                {card.image && <img src={card.image} alt={card.name} />}
                <div>
                  <strong>{card.name}</strong>
                </div>
                <div>{card.quantity}x</div>
                <div>💰 €{card.price}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TabMatchingLists;
