// fetchExpansions.cjs
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const dotenvPath = path.resolve(__dirname, '..', '.env');
console.log('📍 Provo a caricare .env da:', dotenvPath);

require('dotenv').config({ path: dotenvPath });

// Dopo il load, testalo subito
console.log('🔑 Token letto:', process.env.VITE_CARDTRADER_TOKEN || '❌ NON trovato');

const API_URL = 'https://api.cardtrader.com/api/v2/expansions';
const TOKEN = process.env.VITE_CARDTRADER_TOKEN;

if (!TOKEN) {
  console.error('❌ Missing CARDTRADER_API_TOKEN in .env');
  process.exit(1);
}

(async () => {
  try {
    console.log('📦 Fetching expansions...');
    const res = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    const data = await res.json();

    // Crea mappa { code: id }
    const map = {};
    for (const exp of data) {
      if (exp.code && exp.id && exp.game_id === 1) {
        map[exp.code.toUpperCase()] = exp.id;
      }
    }

    const outputPath = path.resolve(__dirname, 'expansions.json');
    fs.writeFileSync(outputPath, JSON.stringify(map, null, 2));
    console.log(`✅ expansions.json salvato (${Object.keys(map).length} espansioni)`);
  } catch (err) {
    console.error('❌ Errore:', err.message);
  }
})();
