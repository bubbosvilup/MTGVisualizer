import React from 'react';
import '../styles/DeckCardList.css';

const TYPE_ORDER = ['creature', 'instant', 'sorcery', 'artifact', 'enchantment', 'land', 'other'];

const TAG_MAP = {
  rampCards: { label: 'Ramp', color: '#4caf50' },
  manaRocks: { label: 'Ramp', color: '#4caf50' },
  manaProduction: { label: 'Ramp', color: '#4caf50' },
  tutors: { label: 'Tutor', color: '#ff9800' },
  cardDraw: { label: 'Draw', color: '#2196f3' },
  impulseDraw: { label: 'Draw', color: '#2196f3' },
  singleTargetRemoval: { label: 'Removal', color: '#f44336' },
  massRemoval: { label: 'Wrath', color: '#9c27b0' },
  isWinCondition: { label: 'Wincon', color: '#ff1493' },
  graveyardHate: { label: 'GY Hate', color: '#795548' },
  stax: { label: 'Stax', color: '#607d8b' },
  counterSpells: { label: 'Counter', color: '#00bcd4' },
};

function categorize(card) {
  const type = (card.type || '').toLowerCase();
  if (type.includes('creature')) return 'creature';
  if (type.includes('instant')) return 'instant';
  if (type.includes('sorcery')) return 'sorcery';
  if (type.includes('artifact')) return 'artifact';
  if (type.includes('enchantment')) return 'enchantment';
  if (type.includes('land')) return 'land';
  return 'other';
}

function DeckCardList({ cards, onQtyChange, onRemove }) {
  if (!cards || cards.length === 0) {
    return <p className="empty-deck">Il mazzo è vuoto. Aggiungi qualche carta!</p>;
  }

  const groups = {};
  cards.forEach((c) => {
    const cat = categorize(c);
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(c);
  });

  return (
    <div className="deck-card-stack">
      {TYPE_ORDER.filter((cat) => groups[cat]?.length).map((cat) => (
        <div key={cat} className="deck-group">
          <h4 className="group-title">
            {cat.charAt(0).toUpperCase() + cat.slice(1)} (
            {groups[cat].reduce((sum, item) => sum + (item.qty || item.quantity || 1), 0)})
          </h4>
          <div className="card-items">
            {groups[cat].map((c) => (
              <div
                key={c.name}
                className={`card-item ${c.qty > 1 && !c.isBasic ? 'duplicate' : ''}`}
              >
                <div className="thumb-wrapper">
                  <img
                    className={c.isCommander ? 'commander-img' : ''}
                    src={c.image || 'https://via.placeholder.com/80x110?text=Card'}
                    alt={c.name}
                  />
                  <span className="qty-badge">{c.qty}</span>
                </div>
                <div className="card-info">
                  <span className="card-name">{c.name}</span>
                  <div className="card-tags">
                    {(() => {
                      const tags = [];
                      const added = new Set();
                      const isLand = (c.type || '').toLowerCase().includes('land');
                      Object.entries(TAG_MAP).forEach(([key, { label, color }]) => {
                        if (!c[key]) return;
                        if (label === 'Ramp' && isLand) return; // exclude ramp on lands
                        if (added.has(label)) return; // avoid duplicate labels
                        added.add(label);
                        tags.push(
                          <span key={label} className="tag" style={{ background: color }}>
                            {label}
                          </span>
                        );
                      });
                      return tags;
                    })()}
                  </div>
                  <div className="actions">
                    <button onClick={() => onQtyChange(c.name, 1)}>＋</button>
                    <button onClick={() => onQtyChange(c.name, -1)} disabled={c.qty === 1}>
                      －
                    </button>
                    <button onClick={() => onRemove(c.name)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default DeckCardList;
