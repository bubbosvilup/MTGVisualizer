import React, { useState } from 'react';
import useScryfall from '../hooks/useScryfall';
import '../styles/MoxfieldImport.css';

function MoxfieldImport({ onImport }) {
  const [listText, setListText] = useState('');
  const [errorCards, setErrorCards] = useState([]);
  const scryfallData = useScryfall();

  const normalize = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9/ ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const parseLine = (line) => {
    const match = line.match(/^(\d+)\s+(.+)$/);
    if (!match) return null;
    const qty = parseInt(match[1], 10);
    let name = match[2].trim();
    name = name.replace(/\s+\([^)]*\).*$/, '');
    name = name.replace(/\s+[A-Z]{2,}\d+$/i, '');
    return { qty, name: name.trim() };
  };

  const handleImport = () => {
    const lines = listText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const aggregated = {};
    for (const line of lines) {
      const res = parseLine(line);
      if (!res) continue;
      const key = normalize(res.name);
      aggregated[key] = (aggregated[key] || 0) + res.qty;
    }

    const notFound = [];
    const findCard = (rawName) => {
      const keyNorm = normalize(rawName);
      let found = scryfallData.find((c) => normalize(c.name) === keyNorm);
      if (!found && rawName.includes('//')) {
        const front = rawName.split('//')[0].trim();
        found = scryfallData.find((c) => normalize(c.name) === normalize(front));
      }
      return found;
    };

    const enrichedCards = Object.entries(aggregated)
      .map(([key, qty]) => {
        const card = findCard(key);
        if (!card) {
          notFound.push(key);
          return null;
        }
        return {
          ...card,
          type_line: card.type,
          qty,
          isBasic: /basic land/i.test(card.type || ''),
        };
      })
      .filter(Boolean);

    setErrorCards(notFound);
    if (enrichedCards.length > 0) {
      onImport(enrichedCards);
    }
  };

  return (
    <div className="moxfield-import">
      <h4>📥 Importa lista Moxfield</h4>
      <textarea
        rows={8}
        value={listText}
        onChange={(e) => setListText(e.target.value)}
        placeholder="Incolla qui la lista del deck da Moxfield (es. 1 Sol Ring)"
      />
      <button onClick={handleImport} disabled={!listText.trim()}>
        Importa nel Builder
      </button>
      {errorCards.length > 0 && (
        <div className="import-errors">
          <strong>Carte non trovate:</strong> {errorCards.join(', ')}
        </div>
      )}
    </div>
  );
}

export default MoxfieldImport;
