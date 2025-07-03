const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const printsPath = path.resolve(
  __dirname,
  "data",
  "scryfall-prints-enriched.json"
);
const historyPath = path.resolve(__dirname, "data", "price_history.json");
const token = process.env.VITE_CARDTRADER_TOKEN;

if (!token) {
  console.error("❌ Manca VITE_CARDTRADER_TOKEN nella .env");
  process.exit(1);
}

let prints;
try {
  prints = JSON.parse(fs.readFileSync(printsPath, "utf8"));
} catch (err) {
  console.error(
    "❌ Errore lettura scryfall-prints-enriched.json:",
    err.message
  );
  process.exit(1);
}

let history = {};
if (fs.existsSync(historyPath)) {
  try {
    history = JSON.parse(fs.readFileSync(historyPath, "utf8"));
  } catch (err) {
    console.warn(
      "⚠️ Impossibile leggere price_history.json, verrà sovrascritto"
    );
  }
}

const today = new Date().toISOString().slice(0, 10);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPrices(blueprintId) {
  const url = `https://api.cardtrader.com/api/v2/marketplace/products?blueprint_id=${blueprintId}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const offers = data[String(blueprintId)];
    if (!offers || !Array.isArray(offers) || offers.length === 0) {
      return null;
    }

    const prices = offers
      .slice(0, 5)
      .map((o) => o.price?.cents)
      .filter((c) => typeof c === "number")
      .map((c) => c / 100);

    if (prices.length === 0) {
      return null;
    }

    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = Number((sum / prices.length).toFixed(2));
    const min = Number(Math.min(...prices).toFixed(2));
    const max = Number(Math.max(...prices).toFixed(2));
    return { avg, min, max };
  } catch (err) {
    return null;
  }
}

(async () => {
  for (const card of prints) {
    for (const print of card.prints) {
      const id = print.blueprint;
      if (!id) continue;

      const entry = history[id];
      if (entry && entry.history.some((h) => h.date === today)) {
        continue;
      }

      const stats = await fetchPrices(id);
      if (!stats) {
        console.log(`⚠️ Nessun prezzo trovato per blueprint ${id}`);
        continue;
      }

      if (!history[id]) {
        history[id] = {
          name: card.name,
          set: print.set,
          collector_number: print.collector_number,
          history: [],
        };
      }

      history[id].history.push({
        date: today,
        avg: stats.avg,
        min: stats.min,
        max: stats.max,
      });

      console.log(
        `✅ [${card.name} - ${print.set}] Prezzo medio: ${stats.avg.toFixed(
          2
        )} €, Min: ${stats.min.toFixed(2)} €, Max: ${stats.max.toFixed(2)} €`
      );

      await delay(200);
    }
  }

  const sorted = Object.keys(history)
    .sort((a, b) => Number(a) - Number(b))
    .reduce((acc, key) => {
      acc[key] = history[key];
      return acc;
    }, {});

  fs.writeFileSync(historyPath, JSON.stringify(sorted, null, 2));
})();
