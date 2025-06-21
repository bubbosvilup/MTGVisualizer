export default function getDeckStats(cards = []) {
  if (!Array.isArray(cards) || cards.length === 0) return null;

  const getQty = (c) => {
    const raw = c.qty ?? c.quantity ?? 1;
    return typeof raw === 'number' ? raw : parseInt(raw, 10) || 1;
  };

  const totalCards = cards.reduce((sum, c) => sum + getQty(c), 0);
  const lands = cards.reduce((sum, c) => {
    const isLandType = c.type?.toLowerCase().includes('land');
    const isLandFlag = c.isLand === true;
    return isLandType || isLandFlag ? sum + getQty(c) : sum;
  }, 0);
  const totalCmc = cards.reduce((sum, c) => sum + (c.cmc || 0) * getQty(c), 0);
  const avgCmc = totalCards > 0 ? totalCmc / totalCards : 0;

  // Strategic categories counts based on boolean flags set in scryfall-min.json
  const categoryKeys = [
    'cardDraw',
    'impulseDraw',
    'tutors',
    'rampCards',
    'manaRocks',
    'manaProduction',
    'singleTargetRemoval',
    'massRemoval',
    'enchantmentArtifactRemoval',
    'protection',
    'counterSpells',
    'graveyardHate',
    'stax',
  ];

  const categoryCounts = {};
  categoryKeys.forEach((key) => {
    categoryCounts[key] = cards.reduce((sum, c) => (c[key] ? sum + getQty(c) : sum), 0);
  });

  return {
    totalCards,
    lands,
    avgCmc,
    ...categoryCounts,
  };
}
