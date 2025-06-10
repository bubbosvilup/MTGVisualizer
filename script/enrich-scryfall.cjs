const fs = require('fs');
const path = require('path');

// Leggi i file
const minRaw = fs.readFileSync(path.join(__dirname, 'src', 'data', 'scryfall-min.json'), 'utf8');
const maxRaw = fs.readFileSync(path.join(__dirname, 'src', 'data', 'scryfall-max.json'), 'utf8');

// Convertili in array JS
const minData = JSON.parse(minRaw);
const maxData = JSON.parse(maxRaw);

// Mappe di lookup per set e collector_number
const map = new Map();
for (const card of maxData) {
  const key = card.name.toLowerCase();
  map.set(key, {
    set: card.set,
    collector_number: card.collector_number,
  });
}

// Aggiungi info ai dati "min"
for (const card of minData) {
  const match = map.get(card.name.toLowerCase());
  if (match) {
    card.set = match.set;
    card.collector_number = match.collector_number;
  }
}

// Salva il file arricchito
fs.writeFileSync(
  path.join(__dirname, 'src', 'data', 'scryfall-enriched.json'),
  JSON.stringify(minData, null, 2),
  'utf8'
);

console.log('✅ Dati arricchiti salvati in scryfall-enriched.json');
