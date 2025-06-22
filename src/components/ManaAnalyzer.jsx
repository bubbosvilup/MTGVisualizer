import React, { useMemo } from 'react';
import '../styles/ManaAnalyzer.css';
import { getManaBaseAdvice } from '../utils/manaAnalyzer';

const COLOR_MAP = {
  W: { name: 'Bianco', hex: '#F8F6D8' },
  U: { name: 'Blu', hex: '#C1D7E9' },
  B: { name: 'Nero', hex: '#BAB1AB' },
  R: { name: 'Rosso', hex: '#E9C4C1' },
  G: { name: 'Verde', hex: '#C4D3C1' },
  C: { name: 'Incolore', hex: '#C8C8C8' },
  Any: { name: 'Qualsiasi', hex: '#C6A2DE' },
};

function ManaAnalyzer({ requirements, sources }) {
  const advice = useMemo(() => getManaBaseAdvice(requirements, sources), [requirements, sources]);

  if (!requirements && !sources) {
    return (
      <div className="mana-analyzer">
        <h4>💡 Analisi Mana Base</h4>
        <p>Aggiungi carte e terre per analizzare il mazzo.</p>
      </div>
    );
  }

  const reqPercentages = requirements ? requirements.percentages : {};
  const reqColors = Object.entries(reqPercentages).filter(([, val]) => val > 0);

  const sourceColors = sources
    ? Object.entries(sources)
        .filter(([key]) => key !== 'Total')
        .filter(([, val]) => val > 0)
    : [];

  return (
    <div className="mana-analyzer">
      <h4>💡 Analisi Mana Base</h4>

      {reqColors.length > 0 && (
        <div className="analysis-section">
          <h5>Requisiti Colore (Magie)</h5>
          <div className="percentage-bars">
            {reqColors.map(([color, value]) => (
              <div key={color} className="bar-container">
                <span className="bar-label">{COLOR_MAP[color].name}</span>
                <div className="bar">
                  <div
                    className="bar-fill"
                    style={{ width: `${value}%`, backgroundColor: COLOR_MAP[color].hex }}
                  ></div>
                </div>
                <span className="bar-value">{value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sources && sources.Total > 0 && (
        <div className="analysis-section">
          <h5>Fonti di Mana ({sources.Total} Terre)</h5>
          <div className="sources-list">
            {sourceColors.map(([color, count]) => (
              <div
                key={color}
                className="source-item"
                style={{
                  borderLeftColor: COLOR_MAP[color].hex,
                }}
              >
                {count}x {COLOR_MAP[color].name}
              </div>
            ))}
          </div>
        </div>
      )}

      {advice && (
        <div className="advice-section">
          <h5>Consigli</h5>
          <div className="advice-text">
            {advice.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ManaAnalyzer;
