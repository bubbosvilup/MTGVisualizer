const fs = require("fs");
const fetch = require("node-fetch");
const path = require("path");

const inputPath = path.resolve("data", "decks.jsonl");
const outputPath = path.resolve("data", "updatedDecks.jsonl");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const cache = new Map();

function parseTypeLine(type_line) {
  const parts = type_line.split("—").map((s) => s.trim());
  const types = parts[0]?.split(" ").map((s) => s.trim()) || [];
  const subtypes = parts[1]?.split(" ").map((s) => s.trim()) || [];
  return { types, subtypes };
}

async function fetchCardData(name) {
  if (cache.has(name)) return cache.get(name);

  try {
    console.log(`🔎 Fetching: ${name}`);
    const response = await fetch(
      `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`
    );

    if (!response.ok) throw new Error(`Errore per ${name}`);

    const data = await response.json();
    const { types, subtypes } = parseTypeLine(data.type_line);
    const result = { types, subtypes };
    cache.set(name, result);
    await sleep(110); // rispetta rate limit Scryfall
    return result;
  } catch (err) {
    console.error(`❌ Errore su "${name}": ${err.message}`);
    const fallback = { types: [], subtypes: [] };
    cache.set(name, fallback);
    return fallback;
  }
}

async function enrichDecks() {
  const lines = fs.readFileSync(inputPath, "utf-8").split("\n").filter(Boolean);
  console.log(`📦 Trovati ${lines.length} mazzi da processare`);

  // svuota il file di output se esiste
  fs.writeFileSync(outputPath, "");

  for (const line of lines) {
    let deck;
    try {
      deck = JSON.parse(line);
    } catch (e) {
      console.warn("⚠️ Riga JSON non valida:", line);
      continue;
    }

    console.log(`🧪 Processing deck: ${deck.name}`);

    for (const card of deck.cards) {
      if (!card.types?.length || !card.subtypes?.length) {
        const enriched = await fetchCardData(card.name);
        card.types = enriched.types;
        card.subtypes = enriched.subtypes;
      }
    }

    fs.appendFileSync(outputPath, JSON.stringify(deck) + "\n");
    console.log(`✅ Salvato deck "${deck.name}"\n`);
  }

  console.log(`🎉 Completato. Mazzi aggiornati in: ${outputPath}`);
}

enrichDecks();
