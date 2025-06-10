// script/minifyScryfallBulk.cjs
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'data', 'scryfall-max.json');
const outputPath = path.join(__dirname, '..', 'data', 'scryfall-min.json');

console.log('📦 Caricamento bulk Scryfall...');
const rawData = fs.readFileSync(inputPath, 'utf-8');
const allCards = JSON.parse(rawData);

console.log(`📄 Carte totali: ${allCards.length}`);

const minified = allCards.map((card) => {
  const name = card.name?.toLowerCase();
  const image = card.image_uris?.png || card.card_faces?.[0]?.image_uris?.png || '';
  const price = card.prices?.eur ? parseFloat(card.prices.eur) : null;
  const type = card.type_line || '';
  const colors = card.colors || [];
  const set = card.set || '';
  const collector_number = card.collector_number || '';

  return { name, image, price, type, colors, set, collector_number };
});

console.log(`✅ Carte elaborate: ${minified.length}`);
console.log(`💾 Scrittura in: ${outputPath}`);

fs.writeFileSync(outputPath, JSON.stringify(minified, null, 2), 'utf-8');

console.log('🎉 Fatto!');
