import React, { useState, useEffect, useMemo } from 'react';
import getDeckStats from '../utils/getDeckStats';
import commanderArchetypes from '../../server/data/commander_archetypes.json';
import archetypeGuidelines from '../../server/data/archetypes-guidelines-standardized.json';
import '../styles/ArchetypeAdvisor.css';

// Build normalized map once
const normalizeName = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

const normalizedArchetypeMap = Object.fromEntries(
  Object.entries(commanderArchetypes).map(([name, archetypes]) => [normalizeName(name), archetypes])
);

function ArchetypeAdvisor({ commander, cards }) {
  const [selectedArchetype, setSelectedArchetype] = useState('');

  // Determine archetypes list
  const archetypes = useMemo(() => {
    if (!commander) return [];
    const key = normalizeName(commander.name);
    const list = normalizedArchetypeMap[key] || [];
    return list;
  }, [commander]);

  useEffect(() => {
    if (archetypes.length > 0 && !selectedArchetype) {
      setSelectedArchetype(archetypes[0]);
    }
  }, [archetypes, selectedArchetype]);

  const stats = useMemo(() => getDeckStats(cards) || {}, [cards]);

  if (!commander) return null;

  if (archetypes.length === 0) {
    return (
      <div className="archetype-advisor">
        <h4>Nessun archetipo registrato per {commander.name}</h4>
      </div>
    );
  }

  const guidelines = archetypeGuidelines[selectedArchetype] || {};

  // Map between guideline keys and stats keys / special handlers
  const statKeyMap = {
    singleRemoval: 'singleTargetRemoval',
    wrath: 'massRemoval',
    tutor: 'tutors',
    protections: 'protection',
    singleInteractions: 'singleTargetRemoval',
    cmcRange: 'avgCmc',
  };

  const getCurrentValue = (guideKey) => {
    const mapped = statKeyMap[guideKey] || guideKey;
    if (mapped === 'avgCmc') return stats.avgCmc ? stats.avgCmc.toFixed(1) : 0;
    return stats[mapped] || 0;
  };

  const renderRow = (key, label) => {
    const current = getCurrentValue(key);
    const range = guidelines[key] || [];
    const [min, max] = range;
    const ok = current >= (min || 0) && (max === undefined || current <= max);
    return (
      <tr key={key} className={ok ? '' : 'deficit'}>
        <td>{label}</td>
        <td>{current}</td>
        <td>{range.length === 0 ? '-' : `${min ?? 0} – ${max ?? '?'}`}</td>
      </tr>
    );
  };

  return (
    <div className="archetype-advisor">
      <h3>📌 Suggerimenti Archetipo</h3>
      {archetypes.length > 1 && (
        <select value={selectedArchetype} onChange={(e) => setSelectedArchetype(e.target.value)}>
          {archetypes.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      )}

      <table className="archetype-guidelines-table">
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Attuale</th>
            <th>Consigliato</th>
          </tr>
        </thead>
        <tbody>{Object.keys(guidelines).map((key) => renderRow(key, key))}</tbody>
      </table>
    </div>
  );
}

export default ArchetypeAdvisor;
