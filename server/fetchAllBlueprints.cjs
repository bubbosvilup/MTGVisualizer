// fetchAllBlueprints.cjs
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const expansionsPath = path.resolve(__dirname, 'data', 'expansions.json');
const outputPath = path.resolve(__dirname, 'data', 'blueprints-all.json');

const token = process.env.VITE_CARDTRADER_TOKEN;
if (!token) {
  console.error('❌ Manca VITE_CARDTRADER_TOKEN nella .env');
  process.exit(1);
}

let expansions;
try {
  expansions = JSON.parse(fs.readFileSync(expansionsPath, 'utf8'));
} catch (err) {
  console.error('❌ Errore nel leggere expansions.json:', err.message);
  process.exit(1);
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const allBlueprints = [];
const seenIds = new Set();

(async () => {
  const entries = Object.entries(expansions);
  console.log(`📦 Espansioni totali da processare: ${entries.length}`);

  for (const [code, id] of entries) {
    const url = `https://api.cardtrader.com/api/v2/blueprints/export?expansion_id=${id}`;
    console.log(`→ Fetching [${code}] (id ${id})`);

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        console.warn(`⚠️ Skip [${code}]: errore HTTP ${res.status}`);
        await delay(300); // piccolo delay anche sugli errori
        continue;
      }

      const blueprints = await res.json();
      const valid = blueprints.filter(
        (b) =>
          b.scryfall_id && !seenIds.has(b.id) && b.name && !b.name.toLowerCase().includes('token')
      );

      for (const bp of valid) {
        seenIds.add(bp.id);
        allBlueprints.push({
          id: bp.id,
          name: bp.name,
          version: bp.version || null,
          scryfall_id: bp.scryfall_id,
          expansion_code: code,
        });
      }

      console.log(`✅ ${valid.length} blueprint salvati da ${code}`);
    } catch (err) {
      console.warn(`❌ Errore su [${code}]: ${err.message}`);
    }

    await delay(400); // evitiamo rate limit
  }

  console.log(`💾 Salvataggio finale in ${outputPath}...`);
  fs.writeFileSync(outputPath, JSON.stringify(allBlueprints, null, 2));
  console.log(`🎉 Completato. Totale blueprint: ${allBlueprints.length}`);
})();
