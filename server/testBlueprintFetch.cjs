// testBlueprintFetch.cjs
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const token = process.env.VITE_CARDTRADER_TOKEN;
if (!token) {
  console.error('❌ TOKEN mancante in .env');
  process.exit(1);
}

const cardName = 'Copper Tablet';
const targetSet = 'lea';
const targetCollector = '238';
const targetScryfallId = '30935e4a-013e-4c46-ad05-304df8e5dfa4';

(async () => {
  const url = `https://api.cardtrader.com/api/v2/blueprints?name=${encodeURIComponent(cardName)}`;

  console.log(`🔍 Fetching blueprint for: ${cardName}...`);
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`❌ Errore HTTP: ${res.status}`);
      process.exit(1);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error('❌ Risposta non valida:', data);
      process.exit(1);
    }

    const match = data.find((item) => {
      return (
        item.scryfall_id === targetScryfallId ||
        (item.version?.toLowerCase() === targetCollector.toLowerCase() &&
          item.expansion_code?.toLowerCase() === targetSet)
      );
    });

    if (!match) {
      console.warn('⚠️ Nessun blueprint esatto trovato');
      console.log('↪️ Opzioni ricevute:');
      data.forEach((d) =>
        console.log(
          `- ${d.name} [${d.expansion_code} ${d.version}] id=${d.id} scryfall=${d.scryfall_id}`
        )
      );
      return;
    }

    console.log('✅ Blueprint trovato:', match.id);
    console.log('🖼️  Immagine:', match.image_url || '(nessuna)');
    console.log('💰 Prezzo più basso (da fetch separato necessario)');

    // Opzionale: fetch prezzo live
    const offersUrl = `https://api.cardtrader.com/api/v2/blueprints/${match.id}/offers`;
    const offersRes = await fetch(offersUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!offersRes.ok) {
      console.error('❌ Errore fetch offerte:', offersRes.status);
      return;
    }

    const offers = await offersRes.json();
    const cheapest = offers?.reduce((acc, cur) => (acc.price_eur < cur.price_eur ? acc : cur));

    if (cheapest) {
      console.log(
        `💶 Prezzo minimo: ${cheapest.price_eur} € (${cheapest.condition}, ${cheapest.language})`
      );
    } else {
      console.log('⚠️ Nessuna offerta disponibile');
    }
  } catch (err) {
    console.error('❌ Errore di rete:', err.message);
  }
})();
