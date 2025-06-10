// query-blueprint.js
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const TOKEN = process.env.VITE_CARDTRADER_TOKEN;
const CARD_NAME = process.argv[2];

if (!CARD_NAME) {
  console.error('❌ Devi passare il nome della carta come argomento!');
  process.exit(1);
}

const url = `https://api.cardtrader.com/api/v2/blueprints?name=${encodeURIComponent(CARD_NAME)}`;

fetch(url, {
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/json',
  },
})
  .then((res) => res.json())
  .then((data) => {
    console.log(`📦 Risultati per "${CARD_NAME}":`);
    console.log(JSON.stringify(data, null, 2));
  })
  .catch((err) => {
    console.error('❌ Errore nella richiesta:', err);
  });
