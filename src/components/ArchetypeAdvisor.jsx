import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import '../styles/ArchetypeAdvisor.css';
import getDeckStats from '../utils/getDeckStats';
import commanderArchetypes from '../../server/data/commander_archetypes.json';
import archetypeGuidelines from '../../server/data/archetypes-guidelines-standardized.json';

// Funzione helper per la normalizzazione dei nomi
const normalizeName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split('//')[0]
    .replace(/[^a-z0-9\s]/g, '') // Rimuove tutta la punteggiatura
    .replace(/\s+/g, ' ') // Normalizza gli spazi
    .trim();
};

const EMPTY_STATS = {
  avgCmc: 0,
  singleTargetRemoval: 0,
  massRemoval: 0,
  tutors: 0,
  rampCards: 0,
  cardDraw: 0,
};

function ArchetypeAdvisor({ commander, cards }) {
  const [selectedArchetype, setSelectedArchetype] = useState('');
  const deckStats = useMemo(() => getDeckStats(cards) || EMPTY_STATS, [cards]);

  const availableArchetypes = useMemo(() => {
    if (!commander) return [];
    const commanderName = normalizeName(commander.name);

    // Cerca l'archetipo in modo case-insensitive direttamente qui
    const commanderKey = Object.keys(commanderArchetypes).find(
      (key) => normalizeName(key) === commanderName
    );

    return commanderKey ? commanderArchetypes[commanderKey] : [];
  }, [commander]);

  useEffect(() => {
    if (availableArchetypes.length > 0) {
      setSelectedArchetype(availableArchetypes[0]);
    } else {
      setSelectedArchetype('');
    }
  }, [availableArchetypes]);

  if (!commander) {
    return (
      <div className="archetype-advisor-placeholder">
        <p>Seleziona un Comandante per visualizzare i consigli sull'archetipo.</p>
      </div>
    );
  }

  if (availableArchetypes.length === 0) {
    return (
      <div className="archetype-advisor-placeholder">
        <p>
          Nessun archetipo specifico trovato per {commander.name}. L'analisi si basa su linee guida
          generali.
        </p>
      </div>
    );
  }

  const guidelines = archetypeGuidelines[selectedArchetype] || {};

  const getRowClass = (current, recommended) => {
    if (!recommended) return '';
    const [min, max] = recommended.split('-').map(Number);
    if (current < min) return 'low';
    if (current > max) return 'high';
    return 'good';
  };

  const STATS_MAP = [
    {
      label: 'S.Removal',
      key: 'singleTargetRemoval',
      recommended: guidelines.singleRemoval?.join(' - '),
    },
    { label: 'Wrath', key: 'massRemoval', recommended: guidelines.wrath?.join(' - ') },
    { label: 'Tutori', key: 'tutors', recommended: guidelines.tutor?.join(' - ') },
    { label: 'Ramp', key: 'rampCards', recommended: guidelines.rampCards?.join(' - ') },
    { label: 'Draw', key: 'cardDraw', recommended: guidelines.cardDraw?.join(' - ') },
    {
      label: 'CMC Medio',
      key: 'avgCmc',
      recommended: guidelines.cmcRange?.join(' - '),
      isCMC: true,
    },
  ];

  return (
    <div className="archetype-advisor">
      {availableArchetypes.length > 0 && (
        <div className="archetype-selector-container">
          <label htmlFor="archetype-select">Archetipo suggerito:</label>
          <select
            id="archetype-select"
            value={selectedArchetype}
            onChange={(e) => setSelectedArchetype(e.target.value)}
            className="archetype-select"
          >
            {availableArchetypes.map((arch) => (
              <option key={arch} value={arch}>
                {arch.charAt(0).toUpperCase() + arch.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="archetype-table-container">
        <table className="archetype-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Attuale</th>
              <th>Ideale</th>
            </tr>
          </thead>
          <tbody>
            {STATS_MAP.map(({ label, key, recommended, isCMC }) => {
              const currentValue = isCMC ? deckStats.avgCmc.toFixed(1) : deckStats[key];
              const rowClass = getRowClass(
                currentValue,
                recommended ? recommended.replace(/\s/g, '') : null
              );

              return (
                <tr key={key} className={rowClass}>
                  <td>{label}</td>
                  <td>{currentValue}</td>
                  <td>{recommended || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="table-legend">
        <span className="legend-item good">In linea</span>
        <span className="legend-item low">Basso</span>
        <span className="legend-item high">Alto</span>
      </div>
    </div>
  );
}

ArchetypeAdvisor.propTypes = {
  commander: PropTypes.object,
  cards: PropTypes.array.isRequired,
};

export default ArchetypeAdvisor;
