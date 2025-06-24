const COLORS = ['W', 'U', 'B', 'R', 'G'];

/**
 * Analizza i requisiti di mana colorato di una lista di carte.
 *
 * @param {Array<Object>} cards - La lista di carte del mazzo. Ogni carta deve avere:
 *   - `qty` (number): La quantità della carta.
 *   - `type_line` (string): La linea di tipo della carta (es. "Creature — Human").
 *   - `mana_cost` (string): Il costo di mana (es. "{1}{W}{U}").
 *   - `cmc` (number): Il costo di mana convertito.
 *   - `colors` (Array<string>): I colori della carta.
 * @returns {Object|null} Un oggetto con i punteggi ponderati, le percentuali e i consigli, o null se non ci sono carte valide.
 */
export function analyzeManaRequirements(cards) {
  const weightedScores = { W: 0, U: 0, B: 0, R: 0, G: 0 };

  // 1. Filtra e processa le carte
  const relevantCards = cards.filter((card) => {
    const type = card.type_line || card.type || '';
    if (!card.mana_cost || type.toLowerCase().includes('land')) {
      return false; // Ignora terre e carte senza costo di mana
    }
    // Ignora artefatti incolori
    if (type.toLowerCase().includes('artifact') && (!card.colors || card.colors.length === 0)) {
      return false;
    }
    return true;
  });

  if (relevantCards.length === 0) {
    return null;
  }

  relevantCards.forEach((card) => {
    // 2. Calcola il peso basato sul CMC
    const weight = 1 / Math.max(card.cmc, 1);
    const manaCost = card.mana_cost;
    const quantity = card.qty || 1;

    // Regex per estrarre simboli di mana (colorati e ibridi)
    const manaSymbolsRegex = /\{([WUBRG/]+)\}/g;
    const matches = manaCost.match(manaSymbolsRegex) || [];

    // 3. Estrai e pesa i simboli di mana
    matches.forEach((symbol) => {
      const value = symbol.replace(/[{}]/g, ''); // es. "W" o "W/U"

      if (value.includes('/')) {
        // Simbolo ibrido: dividi il peso a metà
        const [colorA, colorB] = value.split('/');
        if (COLORS.includes(colorA) && COLORS.includes(colorB)) {
          weightedScores[colorA] += (weight / 2) * quantity;
          weightedScores[colorB] += (weight / 2) * quantity;
        }
      } else {
        // Simbolo colorato standard
        if (COLORS.includes(value)) {
          weightedScores[value] += weight * quantity;
        }
      }
    });
  });

  // 4. Calcola il totale e le percentuali
  const totalScore = Object.values(weightedScores).reduce((sum, score) => sum + score, 0);

  if (totalScore === 0) {
    return {
      percentages: { W: 0, U: 0, B: 0, R: 0, G: 0 },
      advice: 'Il tuo mazzo non ha requisiti di mana colorato.',
    };
  }

  const percentages = {};
  for (const color of COLORS) {
    percentages[color] = (weightedScores[color] / totalScore) * 100;
  }

  // 5. Genera i consigli
  const simpleAdvice = generateSimpleAdvice(percentages);

  return { percentages, advice: simpleAdvice };
}

/**
 * Genera consigli sulla mana base in base alle percentuali di colore.
 * @param {Object} percentages - Le percentuali di requisiti per ogni colore.
 * @returns {string} Una stringa contenente i consigli.
 */
function generateSimpleAdvice(percentages) {
  const sortedColors = Object.entries(percentages)
    .filter(([, perc]) => perc > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedColors.length === 0) {
    return 'Nessun colore rilevato. Probabilmente il mazzo è interamente incolore.';
  }

  const primaryColor = sortedColors[0];
  const colorMap = { W: 'Bianco', U: 'Blu', B: 'Nero', R: 'Rosso', G: 'Verde' };

  let advice = `Il tuo mazzo ha una forte enfasi sul ${colorMap[primaryColor[0]]} (${primaryColor[1].toFixed(
    1
  )}%). Assicurati di avere un numero adeguato di fonti di mana di questo colore.`;

  if (sortedColors.length > 1) {
    const secondaryColor = sortedColors[1];
    advice += ` Il ${colorMap[secondaryColor[0]]} è il tuo secondo colore più importante.`;
  }

  return advice;
}

/**
 * Analizza le fonti di mana (terre) in un mazzo.
 * @param {Array<Object>} cards La lista di carte del mazzo.
 * @returns {Object} Un oggetto con il conteggio delle fonti per colore.
 */
export function analyzeManaSources(cards) {
  const sources = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, Any: 0, Total: 0 };
  const lands = cards.filter((card) => {
    const type = card.type_line || card.type || '';
    return type.toLowerCase().includes('land') && card.qty > 0;
  });

  for (const land of lands) {
    const text = land.oracle_text || '';
    const qty = land.qty;
    sources.Total += qty;

    if (/add one mana of any color/i.test(text)) {
      sources.Any += qty;
      continue;
    }

    const producedColors = new Set();
    const addAbilities = text.match(/add ([^{}.,\n]*\{[WUBRGC]\}[^{}.,\n]*)/gi);

    if (addAbilities) {
      addAbilities.forEach((ability) => {
        const symbols = ability.match(/\{([WUBRGC])\}/g) || [];
        symbols.forEach((symbol) => {
          producedColors.add(symbol.replace(/[{}]/g, ''));
        });
      });
    }

    producedColors.forEach((color) => {
      if (Object.prototype.hasOwnProperty.call(sources, color)) {
        sources[color] += qty;
      }
    });
  }
  return sources;
}

/**
 * Genera consigli confrontando requisiti e fonti di mana.
 * @param {Object} requirements Risultato di analyzeManaRequirements.
 * @param {Object} sources Risultato di analyzeManaSources.
 * @returns {string} Consigli per la mana base.
 */
export function getManaBaseAdvice(requirements, sources) {
  const COLOR_MAP = { W: 'Bianco', U: 'Blu', B: 'Nero', R: 'Rosso', G: 'Verde' };

  if (!sources || sources.Total === 0) {
    return 'Aggiungi terre per analizzare la tua base di mana.';
  }

  const advice = {
    rating: 'ottima', // 'ottima', 'buona', 'da rivedere'
    summary: '',
    points: [],
  };

  // 1. Analisi sul numero totale di terre
  if (sources.Total < 35) {
    advice.points.push(
      `Hai ${sources.Total} terre. Per un mazzo Commander, un punto di partenza comune è 36-38. Potresti soffrire di carenza di mana.`
    );
    advice.rating = 'da rivedere';
  } else if (sources.Total > 41) {
    advice.points.push(
      `Hai ${sources.Total} terre. È un numero alto che potrebbe ridurre la probabilità di pescare magie importanti.`
    );
    advice.rating = 'buona';
  }

  if (
    !requirements ||
    requirements.percentages.W +
      requirements.percentages.U +
      requirements.percentages.B +
      requirements.percentages.R +
      requirements.percentages.G ===
      0
  ) {
    advice.points.push(
      'Il tuo mazzo non ha requisiti di mana colorato. Assicurati che le tue terre incolori siano sufficienti.'
    );
    advice.summary =
      'La mana base per un mazzo incolore è semplice. Controlla solo il numero totale di terre.';
    return advice.points.join(' ');
  }

  const { percentages } = requirements;
  const activeColors = Object.entries(percentages).filter(([, perc]) => perc > 0);

  // 2. Analisi sulla distribuzione dei colori
  let majorImbalance = 0;
  let minorImbalance = 0;

  activeColors.forEach(([color, reqPercent]) => {
    const sourceCount = sources[color] + sources.Any;
    const sourcePercent = sources.Total > 0 ? (sourceCount / sources.Total) * 100 : 0;
    const diff = reqPercent - sourcePercent;

    if (diff > 15) {
      advice.points.push(
        `🔴 Forte carenza di mana ${COLOR_MAP[color]}: il bisogno (${reqPercent.toFixed(0)}%) supera di molto le fonti (${sourcePercent.toFixed(0)}%). Considera più terre che producono questo colore.`
      );
      majorImbalance++;
    } else if (diff > 8) {
      advice.points.push(
        `🟡 Carenza lieve di mana ${COLOR_MAP[color]}: il bisogno (${reqPercent.toFixed(0)}%) è maggiore delle fonti (${sourcePercent.toFixed(0)}%). Potresti ottimizzare le tue terre.`
      );
      minorImbalance++;
    } else if (diff < -20) {
      advice.points.push(
        `🔵 Eccesso di mana ${COLOR_MAP[color]}: hai molte più fonti (${sourcePercent.toFixed(0)}%) del necessario (${reqPercent.toFixed(0)}%). Potresti sostituire alcune terre base con terre multi-colore o utility.`
      );
      minorImbalance++;
    }
  });

  // 3. Consigli specifici sul numero di colori
  if (activeColors.length >= 3) {
    advice.points.push(
      `💡 Con ${activeColors.length} colori, l'uso di terre che producono mana di qualsiasi colore (come Command Tower o Mana Confluence) o terre "tri-land" (come le Triome) è altamente raccomandato per migliorare la consistenza.`
    );
  } else if (activeColors.length === 2) {
    advice.points.push(
      `💡 In un mazzo a due colori, le terre doppie (come le shock-land, fetch-land o le più economiche "pain-land") sono fondamentali per giocare le magie in tempo.`
    );
  }

  const splashColors = activeColors.filter(([, perc]) => perc < 10);
  if (splashColors.length > 0) {
    advice.points.push(
      `Attenzione agli "splash": i colori ${splashColors.map((c) => COLOR_MAP[c[0]]).join(', ')} sono presenti in piccola parte. Assicurati di avere abbastanza fonti per non rimanere bloccato con carte ingiocabili in mano.`
    );
  }

  // 4. Valutazione finale
  if (majorImbalance > 0) {
    advice.rating = 'da rivedere';
    advice.summary =
      'La tua mana base è gravemente sbilanciata. Rischi di non poter lanciare le tue magie in modo affidabile.';
  } else if (minorImbalance > 0) {
    advice.rating = 'buona';
    advice.summary =
      'La tua mana base è funzionale ma potrebbe essere ottimizzata per una maggiore consistenza.';
  } else {
    advice.summary =
      'La tua distribuzione di mana appare ben bilanciata rispetto ai requisiti del mazzo. Ottimo lavoro!';
  }

  if (advice.points.length === 0) {
    return advice.summary;
  }

  return advice.summary + '\n\n' + advice.points.map((p) => `- ${p}`).join('\n');
}
