const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const inputDir = path.join(__dirname, 'public', 'decks_split');
const outputDir = path.join(__dirname, 'public', 'decks_updated');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function extractDeckId(url) {
  const match = url?.match(/decks\/([\w-]+)/);
  return match ? match[1] : null;
}

async function fetchDeckData(deckId, browser) {
  const page = await browser.newPage();
  try {
    const apiUrl = `https://api2.moxfield.com/v2/decks/all/${deckId}`;
    await page.goto(apiUrl, { waitUntil: 'networkidle2' });

    const response = await page.evaluate(() => document.body.innerText);
    const json = JSON.parse(response);

    // ✅ Ricostruzione array "cards" usando solo mainboard e commanders
    const mainboardCards = Object.values(json.mainboard || {});
    const commanderCards = Object.values(json.commanders || {});

    const allCards = [...mainboardCards, ...commanderCards].map((entry) => ({
      name: entry.card.name,
      isCommander: entry.board === 'commanders',
      quantity: entry.quantity,
      colors: entry.card.color_identity,
      types: entry.card.type_line?.split(' ') || [],
      subtypes: entry.card.type_line?.split(' — ')[1]?.split(' ') || [],
    }));

    json.cards = allCards;

    await page.close();
    return json;
  } catch (e) {
    console.error(`❌ Errore nel recupero dati per deck ${deckId}:`, e.message);
    await page.close();
    return null;
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const files = fs.readdirSync(inputDir).filter((f) => f.endsWith('.jsonl'));

  for (const file of files) {
    console.log(`\n=== 🔍 Processing file: ${file} ===`);
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);

    const lines = fs.readFileSync(inputPath, 'utf-8').split('\n').filter(Boolean);
    const updatedLines = [];

    let updated = 0;
    let uptodate = 0;
    let failed = 0;
    let skipped = 0;

    for (const [idx, line] of lines.entries()) {
      let deck;
      try {
        deck = JSON.parse(line);
      } catch {
        updatedLines.push(line);
        skipped++;
        console.log(`[${idx}] ⏩ Skipped: line not valid JSON`);
        continue;
      }

      const deckId = extractDeckId(deck.url);
      if (deckId) {
        const updatedDeck = await fetchDeckData(deckId, browser);
        if (updatedDeck && Array.isArray(updatedDeck.cards)) {
          if (
            deck.cards &&
            Array.isArray(deck.cards) &&
            deck.cards.length === updatedDeck.cards.length
          ) {
            uptodate++;
            updatedLines.push(line); // keep the old one, it's up to date
            console.log(`[${idx}] ✅ Up to date: ${deckId} (cards: ${deck.cards.length})`);
          } else {
            updated++;
            updatedLines.push(JSON.stringify(updatedDeck));
            console.log(`[${idx}] 🆕 Updated: ${deckId} (cards: ${updatedDeck.cards.length})`);
          }
        } else {
          failed++;
          updatedLines.push(line);
          console.log(`[${idx}] ⚠️  API failed or no cards: ${deckId}`);
        }
      } else {
        skipped++;
        updatedLines.push(line);
        console.log(`[${idx}] ⏩ Skipped: no url or invalid url`);
      }
    }

    const stream = fs.createWriteStream(outputPath, { flags: 'w', encoding: 'utf-8' });
    for (const line of updatedLines) {
      stream.write(line + '\n');
    }
    stream.end();
    console.log(`\n💾 Saved updated file: ${outputPath}`);
    console.log(
      `📊 Stats for ${file} — Updated: ${updated}, Up to date: ${uptodate}, Failed: ${failed}, Skipped: ${skipped}`
    );
  }

  await browser.close();
  console.log('\n🏁 Completato aggiornamento di tutti i file.');
})();

