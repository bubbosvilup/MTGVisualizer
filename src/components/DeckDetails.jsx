// DeckDetails.jsx
import React from 'react';
import '../styles/DeckDetails.css';
import useScryfall from '../hooks/useScryfall';

function DeckDetails({
  deck,
  collection = [],
  hideOwned = false,
  onExportMissing,
  onCopyList,
  onExportList,
}) {
  const scryfallData = useScryfall();
  if (!deck) return null;
  const collectionMap = new Map();
  collection.forEach((card) => {
    collectionMap.set(card.name.toLowerCase(), card.qty || card.quantity || 0);
  });

  // Calcola carte mancanti e prezzo totale mancanti
  // let totalMissingPrice = 0;
  const cardsWithStatus = deck.cards.map((card) => {
    const owned = collectionMap.get(card.name.toLowerCase()) || 0;
    const missing = owned < (card.quantity || 1);
    // Trova immagine se mancante
    let image = card.image;
    if (!image) {
      const match = scryfallData.find((c) => c.name.toLowerCase() === card.name.toLowerCase());
      image = match?.image || '';
    }
    if (missing && typeof card.price === 'number') {
      // totalMissingPrice += (card.price || 0) * ((card.quantity || 1) - owned);
    }
    return { ...card, owned, missing, image };
  });
  // Ordina: prima possedute (missing: false), poi mancanti (missing: true)
  const cardsToShow = cardsWithStatus
    .filter((c) => !hideOwned || c.missing)
    .sort((a, b) => a.missing - b.missing);

  const handleExport = () => {
    if (!onExportMissing) return;
    const missing = deck.cards.filter((card) => {
      const owned = collectionMap.get(card.name.toLowerCase()) || 0;
      return owned < (card.quantity || 1);
    });
    onExportMissing(missing);
  };

  return (
    <div className="deck-details">
      <h3>{deck.name} – Lista Carte</h3>
      <div className="deck-actions">
        {onExportList && <button onClick={() => onExportList(deck)}>💾 Esporta .txt</button>}
        {onCopyList && <button onClick={() => onCopyList(deck)}>📋 Copia</button>}
        {onExportMissing && <button onClick={handleExport}>❌ Mancanti</button>}
      </div>
      <div className="deck-cards-grid">
        {cardsToShow.map((card, index) => (
          <div key={index} className={`deck-card-detail ${card.missing ? 'missing' : 'owned'}`}>
            <img
              src={card.image || 'https://via.placeholder.com/223x310?text=Card'}
              alt={card.name}
            />
            <div className="card-info">
              <div className="card-name">{card.name}</div>
              <div className="card-qty">
                {card.owned}/{card.quantity || 1}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DeckDetails;
