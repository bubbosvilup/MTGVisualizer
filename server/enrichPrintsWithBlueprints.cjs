// enrichPrintsWithBlueprints.cjs

const fs = require('fs');
const path = require('path');

// Percorsi file
const printsPath = path.resolve(__dirname, 'data', 'scryfall-prints.json');
const blueprintPath = path.resolve(__dirname, 'data', 'blueprints-all.json');
const outputPath = path.resolve(__dirname, 'data', 'scryfall-prints-enriched.json');

// Caricamento file
console.log('📥 Caricamento scryfall-prints.json...');
const printsRaw = fs.readFileSync(printsPath, 'utf8');
const printsData = JSON.parse(printsRaw);

console.log('📥 Caricamento blueprints-all.json...');
const blueprintsRaw = fs.readFileSync(blueprintPath, 'utf8');
const blueprintsList = JSON.parse(blueprintsRaw);

// Costruzione mappa scryfall_id → blueprint_id
console.log('🔧 Costruzione mappa scryfall_id → blueprint_id...');
const idMap = new Map();

for (const bp of blueprintsList) {
  if (bp.scryfall_id && bp.id) {
    idMap.set(bp.scryfall_id.toLowerCase(), bp.id);
  }
}

let enrichedCount = 0;
let totalPrints = 0;

console.log('🧠 Enrichment in corso...');
for (const card of printsData) {
  for (const p of card.prints) {
    totalPrints++;
    if (p.scryfall_id) {
      const id = idMap.get(p.scryfall_id.toLowerCase());
      if (id) {
        p.blueprint = id;
        enrichedCount++;
      }
    }
  }
}

console.log(`✅ Enrichment completato: ${enrichedCount}/${totalPrints} stampe aggiornate`);

fs.writeFileSync(outputPath, JSON.stringify(printsData, null, 2));
console.log(`💾 File salvato in: ${outputPath}`);
