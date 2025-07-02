// testBlueprintPrice.cjs
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const blueprintId = 18046; // Sol Ring WHO
const TOKEN = process.env.VITE_CARDTRADER_TOKEN;

if (!TOKEN) {
  console.error('❌ Token mancante.');
  process.exit(1);
}

(async () => {
  const url = `https://api.cardtrader.com/api/v2/marketplace/products?blueprint_id=${blueprintId}`;
  console.log(`🔍 Fetching offers for blueprint ${blueprintId}...`);

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`❌ Errore HTTP ${res.status} - ${res.statusText}`);
      return;
    }

    const data = await res.json();
    const offers = data[String(blueprintId)];

    if (!offers || !Array.isArray(offers) || offers.length === 0) {
      console.warn(`⚠️ Nessuna offerta trovata per blueprint ${blueprintId}`);
      return;
    }

    // Prendi solo i primi 5 risultati
    const topOffers = offers.slice(0, 5);
    const prices = topOffers
      .map((o) => o.price?.cents)
      .filter((c) => typeof c === 'number')
      .map((cents) => cents / 100);

    if (prices.length === 0) {
      console.warn(`⚠️ Nessun prezzo valido tra le prime 5 offerte`);
      return;
    }

    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = (sum / prices.length).toFixed(2);
    const min = Math.min(...prices).toFixed(2);
    const max = Math.max(...prices).toFixed(2);

    console.log(`✅ Prezzi (prime 5 offerte) per blueprint ${blueprintId}:`);
    console.log(`   → Prezzo medio: ${avg} €`);
    console.log(`   → Prezzo min:   ${min} €`);
    console.log(`   → Prezzo max:   ${max} €`);
  } catch (err) {
    console.error('❌ Errore di rete:', err.message);
  }
})();
