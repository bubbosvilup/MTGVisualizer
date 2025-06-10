// scraperDeck.js
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const IDS_FILE = path.join(__dirname, "..", "data", "decksID.jsonl");
const OUTPUT_FILE = path.join(__dirname, "..", "data", "decks.jsonl");
const ERROR_LOG = path.join(__dirname, "..", "logs", "errors.log");

// Lista delle carte da escludere (blacklist)
const BLACKLISTED_CARDS = new Set([
  "Stasis",
  "Winter Orb",
  "Nadu, Winged Wisdom",
  "Vorinclex, Voice of Hunger",
  "Armageddon",
  "Thassa's Oracle",
  "Stasis Orb",
  "Tergrid, God of Fright",
  "The One Ring",
  "Apocalypse",
  "Jin-Gitaxias, Core Augur",
  "The Tabernacle at Pendrell Vale",
  "Rhystic Study",
  "Dockside Extortionist",
  "Expropriate",
  "Drannith Magistrate",
  "Devastation",
  "Grand Arbiter Augustin IV",
  "Jokulhaups",
  "Ravage of War",
  "Obliterate",
  "Hokori, Dust Drinker",
  "Decree of Annihilation",
  "Sunder",
  "Cyclonic Rift",
  "Fierce Guardianship",
  "Nether Void",
  "Humility",
  "Rising Waters",
  "Opposition Agent",
  "Worldfire",
  "Mindslaver",
  "Sheoldred, the Apocalypse",
  "Orcish Bowmasters",
  "Emrakul, the Promised End",
  "Jeweled Lotus",
  "Tectonic Break",
  "Blood Moon",
  "Impending Disaster",
  "Back to Basics",
  "Farewell",
  "Smokestack",
  "Toxrill, the Corrosive",
  "Gaea's Cradle",
  "Mana Crypt",
  "Winter Moon",
  "Blightsteel Colossus",
  "Time Stretch",
  "Void Winnower",
  "Mana Breach",
  "Narset, Parter of Veils",
  "Wake of Destruction",
  "Thieves' Auction",
  "Jin-Gitaxias, Progress Tyrant",
  "Urza, Lord High Artificer",
  "Edgar Markov",
  "Sen Triplets",
  "Epicenter",
  "Global Ruin",
  "Teferi's Protection",
  "Catastrophe",
  "Narset, Enlightened Master",
  "Warp World",
  "Scrambleverse",
  "Force of Will",
  "Ad Nauseam",
  "Oko, Thief of Crowns",
  "Divine Intervention",
  "Mana Drain",
  "Flashfires",
  "Boil",
  "Elesh Norn, Mother of Machines",
  "Yuriko, the Tiger's Shadow",
  "Boiling Seas",
  "Force of Negation",
  "Atraxa, Praetors' Voice",
  "Teferi, Time Raveler",
  "Ulamog, the Defiler",
  "Vorinclex, Monstrous Raider",
  "Time Warp",
  "Time Sieve",
  "Thoughts of Ruin",
  "Elesh Norn, Grand Cenobite",
  "Demonic Consultation",
  "Koma, Cosmos Serpent",
  "Ruination",
  "Omniscience",
  "Temporal Manipulation",
  "Nexus of Fate",
  "Ulamog, the Ceaseless Hunger",
  "Craterhoof Behemoth",
  "Dictate of Erebos",
  "Aura Shards",
  "Possessed Portal",
  "Overwhelming Splendor",
  "Mana Vortex",
  "Kinnan, Bonder Prodigy",
  "Karn, the Great Creator",
  "Korvold, Fae-Cursed King",
  "Black Lotus",
  "Mox Pearl",
  "Balance",
  "Mind Twist",
  "Time Walk",
  "Copy Artifact",
  "Mox Emerald",
  "Ancestral Recall",
  "Mox Ruby",
  "Mox Sapphire",
  "Mox Jet",
  "Chains of Mephistopheles",
  "Survival of the Fittest",
  "Gilded Drake",
  "Grim Monolith",
]);

/**
 * Controlla se un deck contiene carte blacklisted
 * @param {Array} cardList - Lista delle carte del deck
 * @returns {Object} - { hasBlacklisted: boolean, blacklistedCards: Array }
 */
function checkBlacklistedCards(cardList) {
  const foundBlacklisted = [];

  for (const card of cardList) {
    if (BLACKLISTED_CARDS.has(card.name)) {
      foundBlacklisted.push(card.name);
    }
  }

  return {
    hasBlacklisted: foundBlacklisted.length > 0,
    blacklistedCards: foundBlacklisted,
  };
}

/**
 * Conta il numero totale di carte nel deck (mainboard + sideboard)
 * @param {Object} mainboard - Carte principali
 * @param {Object} sideboard - Carte sideboard (opzionale)
 * @returns {number} - Numero totale di carte
 */
function countTotalCards(mainboard, sideboard = {}) {
  let total = 0;

  // Conta carte mainboard
  Object.values(mainboard || {}).forEach((card) => {
    total += card.quantity || 1;
  });

  // Conta carte sideboard
  Object.values(sideboard || {}).forEach((card) => {
    total += card.quantity || 1;
  });

  return total;
}

(async () => {
  console.log("🚀 Avvio scraper deck migliorato");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
  );

  // Leggi gli ID
  const rawIDs = await fs.promises.readFile(IDS_FILE, "utf-8");
  const ids = rawIDs
    .split("\n")
    .map((l) => {
      try {
        return JSON.parse(l).id;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  // Carica deck già processati
  let processed = new Set();
  if (fs.existsSync(OUTPUT_FILE)) {
    const existing = await fs.promises.readFile(OUTPUT_FILE, "utf-8");
    existing.split("\n").forEach((line) => {
      try {
        const parsed = JSON.parse(line);
        if (parsed.id) processed.add(parsed.id);
      } catch {}
    });
  }

  // Crea directory necessarie
  await fs.promises.mkdir(path.dirname(ERROR_LOG), { recursive: true });
  if (!fs.existsSync(OUTPUT_FILE)) {
    await fs.promises.writeFile(OUTPUT_FILE, "");
  }

  console.log(`📦 Totale ID trovati: ${ids.length}`);
  console.log(`📄 Deck già presenti: ${processed.size}`);
  console.log(`🚫 Carte blacklisted: ${BLACKLISTED_CARDS.size}`);

  // Statistiche
  let totalProcessed = 0;
  let skippedAlreadyProcessed = 0;
  let skippedOld = 0;
  let skippedExpensive = 0;
  let skippedBlacklisted = 0;
  let skippedTooFewCards = 0; // NUOVA STATISTICA
  let saved = 0;

  for (let i = 0; i < ids.length; i++) {
    const deckId = ids[i];

    if (processed.has(deckId)) {
      console.log(`⏭️  ${deckId} già processato, salto.`);
      skippedAlreadyProcessed++;
      continue;
    }

    const url = `https://api2.moxfield.com/v2/decks/all/${deckId}`;
    console.log(`📥 ${i + 1}/${ids.length} - Scarico ${deckId}`);

    try {
      const response = await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      const text = await response.text();
      const json = JSON.parse(text);
      totalProcessed++;

      // 1. Controlla numero di carte PRIMA di tutti gli altri controlli
      const totalCards = countTotalCards(json.mainboard, json.sideboard);
      if (totalCards < 99) {
        console.log(
          `🃏 ${deckId} ha solo ${totalCards} carte (minimo 99), scartato.`
        );
        skippedTooFewCards++;
        continue;
      } else {
        console.log(`🃏 ${deckId} ha ${totalCards} carte - OK`);
      }

      // 2. Escludi deck troppo vecchi
      const createdDate = new Date(json.dateCreated);
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      if (createdDate < threeYearsAgo) {
        console.log(
          `🕰️ ${deckId} troppo vecchio (${json.dateCreated}), scartato.`
        );
        skippedOld++;
        continue;
      }

      // 3. Escludi deck troppo costosi
      let price = null;

      if (json.price?.eur) {
        price = parseFloat(json.price.eur);
      } else if (json.price?.paper?.eur) {
        price = parseFloat(json.price.paper.eur);
      }

      if (price !== null && !isNaN(price)) {
        if (price > 350) {
          console.log(`💰 ${deckId} costa troppo (${price}€), scartato.`);
          skippedExpensive++;
          continue;
        } else {
          console.log(`💸 Prezzo accettabile per ${deckId}: ${price}€`);
        }
      } else {
        console.log(`📭 Nessun prezzo disponibile per ${deckId}`);
      }

      // 4. Prepara lista carte per controlli
      const commanderIds = Object.keys(json.commanders || {});
      const allCards = Object.values(json.mainboard || {});
      const cardList = allCards.map((card) => ({
        name: card.card.name,
        colors: card.card.colors || [],
        types: card.card.types || [],
        subtypes: card.card.subtypes || [],
        isCommander: commanderIds.includes(card.card.scryfall_id),
        quantity: card.quantity || 1,
      }));

      // 5. Controlla carte blacklisted
      const blacklistCheck = checkBlacklistedCards(cardList);
      if (blacklistCheck.hasBlacklisted) {
        console.log(
          `🚫 ${deckId} contiene carte blacklisted: ${blacklistCheck.blacklistedCards.join(
            ", "
          )}, scartato.`
        );
        skippedBlacklisted++;
        continue;
      }

      // 6. Salva deck valido
      const deckEntry = {
        id: deckId,
        name: json.name || "Unknown",
        url: json.publicUrl || `https://moxfield.com/decks/${deckId}`,
        totalCards: totalCards,
        price: price,
        created: json.dateCreated,
        cards: cardList,
      };

      await fs.promises.appendFile(
        OUTPUT_FILE,
        JSON.stringify(deckEntry) + "\n"
      );

      console.log(`✅ Salvato deck ${deckId} (${totalCards} carte)`);
      processed.add(deckId);
      saved++;

      // Delay tra richieste
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      const msg = `❌ Errore su ${deckId}: ${err.message}\n`;
      console.error(msg);
      await fs.promises.appendFile(ERROR_LOG, msg);
    }

    // Stampa statistiche intermedie ogni 50 deck
    if ((i + 1) % 50 === 0) {
      console.log(`\n📊 Statistiche intermedie (${i + 1}/${ids.length}):`);
      console.log(`   - Deck processati: ${totalProcessed}`);
      console.log(`   - Deck salvati: ${saved}`);
      console.log(`   - Scartati (già processati): ${skippedAlreadyProcessed}`);
      console.log(`   - Scartati (troppo poche carte): ${skippedTooFewCards}`);
      console.log(`   - Scartati (età): ${skippedOld}`);
      console.log(`   - Scartati (prezzo): ${skippedExpensive}`);
      console.log(`   - Scartati (blacklist): ${skippedBlacklisted}\n`);
    }
  }

  console.log("\n🎉 Completato!");
  console.log(`📊 Statistiche finali:`);
  console.log(`   - Deck processati: ${totalProcessed}`);
  console.log(`   - Deck salvati: ${saved}`);
  console.log(`   - Scartati (già processati): ${skippedAlreadyProcessed}`);
  console.log(`   - Scartati (troppo poche carte): ${skippedTooFewCards}`);
  console.log(`   - Scartati (età): ${skippedOld}`);
  console.log(`   - Scartati (prezzo): ${skippedExpensive}`);
  console.log(`   - Scartati (blacklist): ${skippedBlacklisted}`);

  await browser.close();
})();
