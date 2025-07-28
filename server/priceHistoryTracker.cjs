const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const TOKEN = process.env.VITE_CARDTRADER_TOKEN;
if (!TOKEN) {
  console.error("❌ VITE_CARDTRADER_TOKEN mancante in .env");
  process.exit(1);
}

const PRINTS_PATH = path.join(
  __dirname,
  "..",
  "server",
  "data",
  "scryfall-prints-enriched.json"
);
const HISTORY_PATH = path.join(
  __dirname,
  "..",
  "server",
  "data",
  "price_history.json"
);

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function hasEntryForToday(historyEntry, today) {
  return (
    Array.isArray(historyEntry?.history) &&
    historyEntry.history.some((h) => h.date === today)
  );
}

(async () => {
  const printsData = readJson(PRINTS_PATH) || [];
  const history = readJson(HISTORY_PATH) || {};
  const today = new Date().toISOString().slice(0, 10);

  let processedCount = 0;
  let totalCards = 0;

  // Conta il totale per il progresso
  for (const card of printsData) {
    totalCards += (card.prints || []).length;
  }

  console.log(`🚀 Inizio elaborazione di ${totalCards} blueprint...`);

  for (const card of printsData) {
    for (const print of card.prints || []) {
      const blueprintId = print.blueprint;
      const key = String(blueprintId);
      processedCount++;

      console.log(
        `\n[${processedCount}/${totalCards}] Blueprint ${blueprintId} (${card.name} - ${print.set})`
      );

      if (history[key] && hasEntryForToday(history[key], today)) {
        console.log(`⏭️ Già processato oggi, salto...`);
        continue;
      }

      const url = `https://api.cardtrader.com/api/v2/marketplace/products?blueprint_id=${blueprintId}`;
      try {
        console.log(`🔍 Chiamata API...`);

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            Accept: "application/json",
          },
        });

        // Gestione specifica per rate limiting
        if (res.status === 429) {
          console.log(
            `⏳ Rate limit raggiunto per blueprint ${blueprintId}, attendo 5 secondi...`
          );
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue; // Riprova questo blueprint nel prossimo ciclo
        }

        if (!res.ok) {
          console.log(
            `⚠️ HTTP ${res.status} per blueprint ${blueprintId} (${card.name})`
          );
          // Se è un errore 5xx, potrebbe essere temporaneo
          if (res.status >= 500) {
            console.log(
              `   Errore server, attendo 2 secondi prima di continuare...`
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
          continue;
        }

        const data = await res.json();

        // Debug: mostra la struttura della risposta
        console.log(`📊 Struttura risposta per blueprint ${blueprintId}:`, {
          keys: Object.keys(data),
          dataType: typeof data,
          isArray: Array.isArray(data),
          hasKey: key in data,
          dataLength: Array.isArray(data)
            ? data.length
            : Object.keys(data).length,
        });

        // Proviamo diversi modi per accedere ai dati
        let offers = null;

        // Metodo 1: come nel codice originale
        if (data[key]) {
          offers = data[key];
          console.log(`✓ Trovato con chiave ${key}`);
        }
        // Metodo 2: se la risposta è direttamente un array
        else if (Array.isArray(data)) {
          offers = data;
          console.log(`✓ Risposta è un array diretto`);
        }
        // Metodo 3: se c'è una proprietà 'products' o simile
        else if (data.products) {
          offers = data.products;
          console.log(`✓ Trovato in data.products`);
        }
        // Metodo 4: se c'è una proprietà 'data'
        else if (data.data) {
          offers = data.data;
          console.log(`✓ Trovato in data.data`);
        }

        if (!Array.isArray(offers) || offers.length === 0) {
          console.log(
            `⚠️ Nessun offer valido per blueprint ${blueprintId} (${card.name})`
          );
          if (offers) {
            console.log(
              `   Tipo offers:`,
              typeof offers,
              Array.isArray(offers) ? `Array[${offers.length}]` : ""
            );
          }
          continue;
        }

        console.log(`📈 Trovati ${offers.length} offers per ${card.name}`);

        const prices = offers
          .slice(0, 5)
          .map((o, index) => {
            console.log(`   Offer ${index}:`, {
              hasPrice: !!o.price,
              priceCents: o.price?.cents,
              priceAmount: o.price?.amount,
              currency: o.price?.currency,
            });

            // Proviamo diversi formati di prezzo
            if (o.price && typeof o.price.cents === "number") {
              return o.price.cents / 100;
            } else if (o.price && typeof o.price.amount === "number") {
              return o.price.amount;
            } else if (typeof o.price === "number") {
              return o.price;
            }
            return null;
          })
          .filter((v) => v !== null);

        if (prices.length === 0) {
          console.log(
            `⚠️ Nessun prezzo valido estratto per blueprint ${blueprintId} (${card.name})`
          );
          continue;
        }

        const sum = prices.reduce((a, b) => a + b, 0);
        const avg = parseFloat((sum / prices.length).toFixed(2));
        const min = parseFloat(Math.min(...prices).toFixed(2));
        const max = parseFloat(Math.max(...prices).toFixed(2));

        if (!history[key]) {
          history[key] = {
            name: card.name,
            set: print.set,
            collector_number: print.collector_number,
            history: [],
          };
        }

        history[key].history.push({ date: today, avg, min, max });

        console.log(
          `✅ [${card.name} - ${print.set}] Prezzo medio: ${avg} €, Min: ${min} €, Max: ${max} € (da ${prices.length} prezzi)`
        );

        // Pausa di 1 secondo tra le richieste
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        console.log(
          `❌ Errore per blueprint ${blueprintId} (${card.name}):`,
          err.message
        );
      }
    }
  }

  const sorted = Object.keys(history)
    .sort((a, b) => Number(a) - Number(b))
    .reduce((acc, id) => {
      acc[id] = history[id];
      return acc;
    }, {});

  writeJson(HISTORY_PATH, sorted);
  console.log(
    `🏁 Completato! Aggiornati ${Object.keys(sorted).length} blueprint`
  );
})();
