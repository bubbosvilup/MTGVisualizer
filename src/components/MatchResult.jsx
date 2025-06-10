import React, { useState } from 'react';
import DeckCard from './DeckCard';
import DeckDetails from './DeckDetails';
import '../styles/MatchResult.css';
import { useDecks } from '../context/useDecks';

function MatchResult({ decks }) {
  const { collection } = useDecks(); // 👈
  const [expandedDeckId, setExpandedDeckId] = useState(null);

  const handleClick = (deck) => {
    setExpandedDeckId((prevId) => (prevId === deck.id ? null : deck.id));
  };

  return (
    <div className="match-results">
      {decks.map((deck) => (
        <div key={deck.id} className="match-deck-wrapper">
          <DeckCard deck={deck} onClick={handleClick} />
          {expandedDeckId === deck.id && <DeckDetails deck={deck} collection={collection} />}
        </div>
      ))}
    </div>
  );
}

export default MatchResult;
