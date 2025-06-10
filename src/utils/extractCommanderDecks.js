// extractCommanderDecks.js

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Cartelle da scandire
const directories = [
  "C:/Users/be_fr/Desktop/decks/mtgjson",
  "C:/Users/be_fr/Desktop/decks/yt/20250507_222314",
];

// File di output
const outputFile = "C:/Users/be_fr/mox-scraper/data/decks.jsonl";

// Genera ID casuale
const generateId = () => crypto.randomBytes(12).toString("hex");

// Leggi e identifica deck Commander
function readDeckFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");

  // Check se il deck è Commander
  const commanderMatch = content.match(/\[Commander\]\s*\n(.+)/i);
  if (!commanderMatch) return null;

  // Estrai Commander
  const commanderLine = commanderMatch[1].trim();
  const [cmdQuantity, ...cmdParts] = commanderLine.split(" ");
  const commanderName = cmdParts.join(" ").split("|")[0];

  const commanderCard = {
    name: commanderName,
    colors: ["?"], // placeholder
    types: [],
    subtypes: [],
    isCommander: true,
    quantity: parseInt(cmdQuantity, 10),
  };

  // Estrai nome mazzo
  const nameMatch = content.match(/Name=(.+)/i);
  const deckName = nameMatch ? nameMatch[1].trim() : "Unnamed Deck";

  // Estrai carte [Main]
  const cardMatches = content.match(/\[Main\]([\s\S]+?)(\[|$)/i);
  if (!cardMatches) return null;

  const cardLines = cardMatches[1].trim().split("\n").filter(Boolean);

  const mainCards = cardLines.map((line) => {
    const [quantity, ...cardParts] = line.trim().split(" ");
    const cardName = cardParts.join(" ").split("|")[0];

    return {
      name: cardName,
      colors: ["?"], // placeholder
      types: [],
      subtypes: [],
      isCommander: false,
      quantity: parseInt(quantity, 10),
    };
  });

  const cards = [commanderCard, ...mainCards];

  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0);

  return {
    id: generateId(),
    name: deckName,
    url: "",
    totalCards,
    price: null,
    cards,
  };
}

// Funzione ricorsiva per scansionare directory
function scanDirectories(dir) {
  const files = fs.readdirSync(dir);
  const decks = [];

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      decks.push(...scanDirectories(fullPath));
    } else if (path.extname(fullPath) === ".dck") {
      const deck = readDeckFile(fullPath);
      if (deck && deck.totalCards > 65) {
        decks.push(deck);
        console.log(`✅ Aggiunto: ${deck.name}`);
      }
    }
  });

  return decks;
}

// Esecuzione principale
function main() {
  const allDecks = [];

  directories.forEach((dir) => {
    if (fs.existsSync(dir)) {
      console.log(`📁 Scansiono directory: ${dir}`);
      const decks = scanDirectories(dir);
      allDecks.push(...decks);
    } else {
      console.warn(`⚠️ Directory non trovata: ${dir}`);
    }
  });

  // Scrivi risultati nel file JSONL
  const stream = fs.createWriteStream(outputFile, { flags: "a" });
  allDecks.forEach((deck) => {
    stream.write(JSON.stringify(deck) + "\n");
  });
  stream.end();

  console.log(`🎉 Completato! ${allDecks.length} mazzi Commander aggiunti.`);
}

// Avvia lo script
main();
