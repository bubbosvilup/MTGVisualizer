import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import '../styles/ArchetypeAdvisor.css';
import getDeckStats from '../utils/getDeckStats';
import commanderArchetypes from '../../server/data/commander_archetypes.json';
import archetypeGuidelines from '../../server/data/archetypes-guidelines-standardized.json';

// Funzione helper per la normalizzazione dei nomi
const normalizeName = (name) => {
  if (!name) return '';
  return name.toLowerCase().split('//')[0].trim();
};

function ArchetypeAdvisor({ commander, cards }) {
  const [selectedArchetype, setSelectedArchetype] = useState('');
  const deckStats = useMemo(() => getDeckStats(cards), [cards]);

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
      label: 'Rimozioni Singole',
      key: 'singleRemoval',
      recommended: guidelines.single_removal_count,
    },
    { label: 'Rimozioni Globali', key: 'boardWipes', recommended: guidelines.board_wipes_count },
    { label: 'Tutori', key: 'tutors', recommended: guidelines.tutors_count },
    { label: 'Ramp', key: 'ramp', recommended: guidelines.ramp_count },
    { label: 'Pescata', key: 'cardDraw', recommended: guidelines.card_draw_count },
    { label: 'CMC Medio', key: 'avgCMC', recommended: guidelines.avg_cmc, isCMC: true },
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
              <th>Categoria</th>
              <th>Attuale</th>
              <th>Consigliato</th>
            </tr>
          </thead>
          <tbody>
            {STATS_MAP.map(({ label, key, recommended, isCMC }) => {
              const currentValue = isCMC ? deckStats.avgCMC.toFixed(1) : deckStats[key];
              const rowClass = getRowClass(currentValue, recommended);

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
