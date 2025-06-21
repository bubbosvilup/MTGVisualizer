export default function getDeckStats(cards = []) {
  if (!Array.isArray(cards) || cards.length === 0) return null;

  const totalCards = cards.reduce((sum, c) => sum + (c.qty || 0), 0);
  const lands = cards.reduce(
    (sum, c) => (c.type?.toLowerCase().includes('land') ? sum + c.qty : sum),
    0
  );
  const totalCmc = cards.reduce((sum, c) => sum + (c.cmc || 0) * c.qty, 0);
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
  ];

  const categoryCounts = {};
  categoryKeys.forEach((key) => {
    categoryCounts[key] = cards.reduce((sum, c) => (c[key] ? sum + c.qty : sum), 0);
  });

  return {
    totalCards,
    lands,
    avgCmc,
    ...categoryCounts,
  };
}
