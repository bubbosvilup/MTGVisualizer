import React, { useState } from 'react';
import '../styles/TabDeckLoader.css';
import { useDecks } from '../context/useDecks';

function TabDeckLoader() {
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('🕐 In attesa...');
  const [topCommanders, setTopCommanders] = useState([]);
  const { decks, setDecks } = useDecks();

  const handleLoadDecks = async () => {
    const totalFiles = 8;
    const tempDecks = [];
    const commanderCounts = {};

    setStatus('📡 Inizio caricamento dei mazzi suddivisi...');
    setProgress(0);

    for (let i = 1; i <= totalFiles; i++) {
      setStatus(`📄 Caricamento file ${i} di ${totalFiles}...`);

      try {
        const res = await fetch(`/decks_split/decks-${i}.jsonl`);
        const text = await res.text();
        const lines = text.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (Array.isArray(parsed.cards) && !/cedh/i.test(parsed.name || '')) {
              tempDecks.push(parsed);

              parsed.cards.forEach((card) => {
                if (card.isCommander && card.name) {
                  const name = card.name;
                  commanderCounts[name] = (commanderCounts[name] || 0) + 1;
                }
              });
            }
          } catch (err) {
            console.warn('Errore nel parsing JSON:', err, '\nContenuto:', line);
          }
        }
      } catch (err) {
        console.error(`Errore nel file decks-${i}.jsonl`, err);
      }

      setProgress(((i / totalFiles) * 100).toFixed(1));
    }

    setDecks(tempDecks);

    const totalDecks = tempDecks.length;
    const totalCards = tempDecks.reduce((acc, d) => acc + d.cards.length, 0);
    const sortedCommanders = Object.entries(commanderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    setStats({
      total: totalDecks,
      averageCards: Math.round(totalCards / totalDecks),
      uniqueCommanders: Object.keys(commanderCounts).length,
    });

    setTopCommanders(sortedCommanders);
    setStatus(`✅ Caricati ${totalDecks} mazzi da ${totalFiles} file.`);
  };

  return (
    <div className="deck-loader">
      {decks.length === 0 ? (
        <button onClick={handleLoadDecks}>📥 Carica i mazzi</button>
      ) : (
        <p className="already-loaded">🧠 {decks.length} mazzi già caricati</p>
      )}

      {decks.length === 0 && <p>{status}</p>}
      <progress value={progress} max="100"></progress>

      {stats && (
        <div className="deck-stats">
          <p>📊 Totale mazzi: {stats.total}</p>
          <p>🃏 Media carte per mazzo: {stats.averageCards}</p>
          <p>🧙‍♂️ Comandanti unici: {stats.uniqueCommanders}</p>
        </div>
      )}

      {topCommanders.length > 0 && (
        <div className="top-commanders">
          <h3>🏆 Top 5 Comandanti</h3>
          <ul>
            {topCommanders.map(([name, count]) => (
              <li key={name}>
                <strong>{name}</strong> – {count} mazzi
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TabDeckLoader;
