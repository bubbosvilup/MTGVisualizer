import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import ManaCurveChart from './ManaCurveChart';
import ColorPieChart from './ColorPieChart';
import ManaAnalyzer from './ManaAnalyzer';
import ArchetypeAdvisor from './ArchetypeAdvisor';
import '../styles/DeckTech.css';

function DeckTech({ cards, commander, manaRequirements, manaSources }) {
  const hasCommander = commander !== null;

  return (
    <div className="deck-tech">
      <div className="deck-tech-header">
        <h2>🛠️ Deck Tech</h2>
      </div>
      <div className="deck-tech-sections">
        <CollapsibleSection title="📊 Analisi Mana" defaultOpen={true}>
          <ManaCurveChart cards={cards} />
          <ColorPieChart cards={cards} />
          <ManaAnalyzer requirements={manaRequirements} sources={manaSources} />
        </CollapsibleSection>

        <CollapsibleSection title="🧠 Guida Archetipo" defaultOpen={hasCommander}>
          <ArchetypeAdvisor commander={commander} cards={cards} />
        </CollapsibleSection>
      </div>
    </div>
  );
}

export default DeckTech;
