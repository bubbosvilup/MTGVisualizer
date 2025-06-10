# MTG Visualizer

**MTG Visualizer** is a full-featured web tool that allows Magic: The Gathering players to:

- Load and visualize their personal card collection.
- Compare decks (e.g. exported from Moxfield) against that collection.
- Display missing cards with images and prices (via Scryfall and CardTrader APIs).
- Export missing cards to a wishlist directly on CardTrader.

## 🏗 Project Structure

```
mtgVisualizer/
├── public/                # Static assets and pre-processed deck files
│   ├── decks_split/         # JSONL split deck files (used for matching)
│   ├── decks_backup/        # Original backup of deck files
│   └── decks_updated/       # Updated/scraped decks
├── data/                  # Scryfall bulk data (max and minified)
├── src/                   # React frontend
│   ├── components/          # Reusable UI components
│   ├── context/             # Global collection/deck context
│   ├── tabs/                # Tabbed views: Collection, Matching, etc.
│   ├── utils/               # Scripts for parsing and formatting
│   ├── styles/              # CSS modules
│   └── App.jsx              # Main entry point
├── script/               # Node CLI scripts (Scryfall minifier, scraping, etc.)
├── .env                  # Contains sensitive keys like CardTrader token
├── vite.config.js        # Vite bundler config
└── README.md             # This file
```

## ⚙️ Setup

1. **Clone the repo**

```bash
git clone https://github.com/yourusername/mtgVisualizer.git
cd mtgVisualizer
```

2. **Install dependencies**

```bash
npm install
```

3. **Prepare your Scryfall data**

- Download the [Scryfall bulk JSON](https://scryfall.com/docs/api/bulk-data).
- Place it in `data/scryfall-max.json`
- Run:

```bash
node script/minifyScryfallBulk.cjs
```

This generates `data/scryfall-min.json` with only needed fields (`name`, `png image`, `price`, etc.)

4. **Add your .env**

```
VITE_CARDTRADER_TOKEN=your_cardtrader_api_token
```

---

## 💡 Features Overview

- 🃏 **Deck Matching**: Paste Moxfield decklists, match against your collection, see missing cards.
- 🛒 **Wishlist Export**: Select versions of missing cards (set/art/price) and export to CardTrader.
- 📊 **Price Aggregation**: Total missing cost calculated in real-time.
- 📂 **Deck Bulk Management**: Load thousands of decks in split files and filter by match %.

---

## 🧪 Scripts (Node CLI)

Run from `script/` directory:

- `minifyScryfallBulk.cjs`: generates `scryfall-min.json`
- `query-blueprint.js`: queries CardTrader blueprints for selected cards
- `updateDecksFromPuppeteer.cjs`: scraping tool for Moxfield
- `splitDecks.cjs`: splits large `.jsonl` deck files
- `restoreDecksBackup.cjs`: restores original deck state

---

## 🧠 Tech Stack

- **Frontend**: React + Vite + Vanilla CSS
- **APIs**:

  - [Scryfall API](https://scryfall.com/docs/api)
  - [CardTrader API](https://www.cardtrader.com/docs/api)

- **Node Scripts**: For pre-processing and batch tasks

---

## 🚧 Roadmap

- [ ] Add backend (Express) for local data processing and API proxying
- [ ] Add authentication for wishlist actions
- [ ] Allow image caching and offline mode
- [ ] Dark mode / UI improvements
- [ ] Compare multiple decks against collection simultaneously

---

## 📜 License

MIT License — free to use, modify and distribute.

> Made with ☕ and cardboard by Nicco

