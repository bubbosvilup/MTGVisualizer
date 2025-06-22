import React, { useState, useEffect } from 'react';
import CommanderSelector from '../components/CommanderSelector';
import CardSearchAdd from '../components/CardSearchAdd';
import DeckCardList from '../components/DeckCardList';
import MoxfieldImport from '../components/MoxfieldImport';
import DeckTech from '../components/DeckTech';
import { analyzeManaRequirements, analyzeManaSources } from '../utils/manaAnalyzer';
import '../styles/TabDeckBuilder.css';

function TabDeckBuilder() {
  const [deckName, setDeckName] = useState('');
  const [commander, setCommander] = useState(null);
  const [cards, setCards] = useState([]);
  const [manaRequirements, setManaRequirements] = useState(null);
  const [manaSources, setManaSources] = useState(null);

  useEffect(() => {
    const reqs = analyzeManaRequirements(cards);
    const sources = analyzeManaSources(cards);
    setManaRequirements(reqs);
    setManaSources(sources);
  }, [cards]);

  const addCard = (card) => {
    setCards((prev) => {
      const existing = prev.find((c) => c.name === card.name);
      const isBasic = /basic land/i.test(card.type || '');
      if (existing) {
        return prev.map((c) => (c.name === card.name ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { ...card, qty: 1, isBasic }];
    });
  };

  const changeQty = (name, delta) => {
    setCards((prev) =>
      prev.map((c) => (c.name === name ? { ...c, qty: Math.max(1, c.qty + delta) } : c))
    );
  };

  const removeCard = (name) => {
    setCards((prev) => prev.filter((c) => c.name !== name));
  };

  const clearDeck = () => {
    if (window.confirm('Sei sicuro di voler rimuovere tutte le carte (tranne il comandante)?')) {
      setCards([]);
    }
  };

  const buildDeckLines = () => {
    const lines = [];
    if (commander) {
      lines.push(`1 ${commander.name}`);
    }
    cards.forEach((c) => {
      lines.push(`${c.qty} ${c.name}`);
    });
    return lines;
  };

  const exportAsTxt = () => {
    const lines = buildDeckLines();
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${deckName || 'deck'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(buildDeckLines().join('\n'));
      alert('Lista copiata negli appunti!');
    } catch {
      alert('Copia negli appunti non riuscita');
    }
  };

  return (
    <div className="tab-deck-builder">
      <h2>🛠️ Deck Builder</h2>
      <div className="builder-header">
        <input
          type="text"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
          placeholder="Nome mazzo"
          className="deck-name-input"
        />
        <CommanderSelector commander={commander} onSelect={setCommander} />
      </div>

      <div className="builder-layout">
        <section className="left-pane">
          <CardSearchAdd onAdd={addCard} />

          <MoxfieldImport onImport={setCards} />

          {cards.length > 0 && (
            <button className="clear-deck-button" onClick={clearDeck}>
              🗑️ Svuota Mazzo
            </button>
          )}

          {cards.length > 0 && (
            <div className="export-buttons">
              <button onClick={exportAsTxt}>💾 Esporta .txt</button>
              <button onClick={copyToClipboard}>📋 Copia</button>
            </div>
          )}

          <DeckCardList cards={cards} onQtyChange={changeQty} onRemove={removeCard} />
        </section>

        <aside className="right-pane">
          <DeckTech
            cards={cards}
            commander={commander}
            manaRequirements={manaRequirements}
            manaSources={manaSources}
          />
        </aside>
      </div>
    </div>
  );
}

export default TabDeckBuilder;
