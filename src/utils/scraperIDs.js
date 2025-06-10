// scraperIDs.js
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const OUTPUT_FILE = path.join(__dirname, "..", "data", "decksID.jsonl");
const ERROR_LOG = path.join(__dirname, "..", "logs", "scraper-ids-errors.log");

// Diverse modalità di ricerca per variare i tipi di deck
const SEARCH_MODES = [
  {
    name: "Più Recenti",
    params: "sortType=created&sortDirection=descending",
    description: "Deck creati di recente",
  },
  {
    name: "Più Votati",
    params: "sortType=likes&sortDirection=descending",
    description: "Deck con più like",
  },
  {
    name: "Più Visualizzati",
    params: "sortType=views&sortDirection=descending",
    description: "Deck più visualizzati",
  },
  {
    name: "Più Commentati",
    params: "sortType=comments&sortDirection=descending",
    description: "Deck con più commenti",
  },
  {
    name: "Aggiornati di Recente",
    params: "sortType=updated&sortDirection=descending",
    description: "Deck aggiornati di recente",
  },
  {
    name: "Casuali Recenti",
    params: "sortType=created&sortDirection=ascending",
    description: "Deck meno recenti (ordine inverso)",
  },
  {
    name: "Meno Votati",
    params: "sortType=likes&sortDirection=ascending",
    description: "Deck con meno like (per trovare gemme nascoste)",
  },
];

// Funzione per ottenere un delay casuale tra richieste
function getRandomDelay(min = 300, max = 800) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Funzione per salvare statistiche di avanzamento
async function saveProgress(stats) {
  const progressFile = path.join(
    __dirname,
    "..",
    "data",
    "scraper-progress.json"
  );
  await fs.promises.writeFile(progressFile, JSON.stringify(stats, null, 2));
}

// Funzione per caricare statistiche esistenti
async function loadProgress() {
  const progressFile = path.join(
    __dirname,
    "..",
    "data",
    "scraper-progress.json"
  );
  try {
    const data = await fs.promises.readFile(progressFile, "utf-8");
    return JSON.parse(data);
  } catch {
    return {
      totalCollected: 0,
      currentModeIndex: 0,
      currentPage: 1,
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      collectedIds: new Set(),
    };
  }
}

(async () => {
  console.log("🚀 Avvio scraper ID infinito con modalità multiple");

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
  );

  // Crea directory necessarie
  await fs.promises.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.promises.mkdir(path.dirname(ERROR_LOG), { recursive: true });

  // Inizializza file se non esistono
  if (!fs.existsSync(OUTPUT_FILE)) {
    await fs.promises.writeFile(OUTPUT_FILE, "");
  }

  // Carica progresso esistente
  let stats = await loadProgress();

  // Carica ID già collezionati per evitare duplicati
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existingData = await fs.promises.readFile(OUTPUT_FILE, "utf-8");
      const existingIds = existingData
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          try {
            return JSON.parse(line).id;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      stats.collectedIds = new Set(existingIds);
      stats.totalCollected = existingIds.length;
      console.log(`📊 Caricati ${stats.totalCollected} ID esistenti`);
    } catch (error) {
      console.log("⚠️ Errore nel caricare ID esistenti, ripartendo da zero");
    }
  }

  console.log(`📈 Statistiche attuali:`);
  console.log(`   - ID totali collezionati: ${stats.totalCollected}`);
  console.log(
    `   - Modalità attuale: ${SEARCH_MODES[stats.currentModeIndex].name}`
  );
  console.log(`   - Pagina attuale: ${stats.currentPage}`);

  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 5;
  let cycleCount = 0;

  // Loop infinito
  while (true) {
    const currentMode = SEARCH_MODES[stats.currentModeIndex];
    const url = `https://api2.moxfield.com/v2/decks/search?pageNumber=${stats.currentPage}&pageSize=64&${currentMode.params}&formats=commander`;

    console.log(
      `\n🔍 [${currentMode.name}] Pagina ${stats.currentPage} (Ciclo ${
        cycleCount + 1
      })`
    );

    try {
      const response = await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      const text = await response.text();
      const json = JSON.parse(text);

      if (!json.data || json.data.length === 0) {
        console.log(
          `🏁 Fine risultati per "${currentMode.name}" - cambio modalità`
        );

        // Passa alla modalità successiva
        stats.currentModeIndex =
          (stats.currentModeIndex + 1) % SEARCH_MODES.length;
        stats.currentPage = 1;

        // Se abbiamo completato tutte le modalità, incrementa il ciclo
        if (stats.currentModeIndex === 0) {
          cycleCount++;
          console.log(
            `🔄 Completato ciclo ${cycleCount}, ripartendo con tutte le modalità`
          );
        }

        consecutiveErrors = 0;
        continue;
      }

      // Filtra ID già esistenti
      const newDecks = json.data.filter(
        (deck) => !stats.collectedIds.has(deck.publicId)
      );

      if (newDecks.length === 0) {
        console.log(
          `⏭️ Tutti gli ID di questa pagina sono già stati collezionati`
        );
        stats.currentPage++;
        continue;
      }

      // Salva nuovi ID
      const lines = newDecks.map((deck) => {
        stats.collectedIds.add(deck.publicId);
        return JSON.stringify({
          id: deck.publicId,
          source: currentMode.name,
          collected_at: new Date().toISOString(),
          page: stats.currentPage,
        });
      });

      await fs.promises.appendFile(OUTPUT_FILE, lines.join("\n") + "\n");

      stats.totalCollected += newDecks.length;
      stats.lastUpdate = new Date().toISOString();

      console.log(
        `✅ Salvati ${newDecks.length} nuovi ID (${
          json.data.length - newDecks.length
        } duplicati)`
      );
      console.log(`📊 Totale ID unici: ${stats.totalCollected}`);

      // Salva progresso ogni 10 pagine
      if (stats.currentPage % 10 === 0) {
        await saveProgress(stats);
        console.log(`💾 Progresso salvato`);
      }

      stats.currentPage++;
      consecutiveErrors = 0;

      // Delay casuale tra richieste
      const delay = getRandomDelay();
      await new Promise((r) => setTimeout(r, delay));
    } catch (error) {
      consecutiveErrors++;
      const errorMsg = `❌ Errore su ${currentMode.name} pagina ${stats.currentPage}: ${error.message}`;
      console.error(errorMsg);

      // Log errore
      const timestamp = new Date().toISOString();
      await fs.promises.appendFile(ERROR_LOG, `[${timestamp}] ${errorMsg}\n`);

      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.log(
          `🚨 Troppi errori consecutivi (${consecutiveErrors}), cambio modalità`
        );

        // Passa alla modalità successiva
        stats.currentModeIndex =
          (stats.currentModeIndex + 1) % SEARCH_MODES.length;
        stats.currentPage = 1;
        consecutiveErrors = 0;

        if (stats.currentModeIndex === 0) {
          cycleCount++;
          console.log(`🔄 Nuovo ciclo ${cycleCount} dopo errori`);
        }
      } else {
        // Ritenta la stessa pagina con un delay maggiore
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  // Questo codice non verrà mai raggiunto, ma è buona pratica includerlo
  await browser.close();
})();
