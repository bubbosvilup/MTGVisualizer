import React, { useMemo } from 'react';
import getDeckStats from '../utils/getDeckStats';
import '../styles/DeckStats.css';

function DeckStats({ cards }) {
  const stats = useMemo(() => getDeckStats(cards), [cards]);

  if (!stats) return null;

  return (
    <div className="deck-stats-overview">
      <h3>📊 Statistiche Mazzo</h3>
      <ul>
        <li>Totale carte: {stats.totalCards}</li>
        <li>Lands: {stats.lands}</li>
        <li>CMC medio: {stats.avgCmc.toFixed(2)}</li>
        <li>Ramp: {stats.rampCards + stats.manaRocks + stats.manaProduction}</li>
        <li>Tutors: {stats.tutors}</li>
        <li>Pescate: {stats.cardDraw + stats.impulseDraw}</li>
        <li>Removal Singolo: {stats.singleTargetRemoval}</li>
        <li>Rimozioni di Massa: {stats.massRemoval}</li>
      </ul>
    </div>
  );
}

export default DeckStats;
