# MTG Visualizer

MTG Visualizer è una Single Page Application (SPA) sviluppata in **React** con **Vite**, pensata per aiutare i giocatori di Magic: The Gathering (formato Commander) a:

- Caricare e gestire la propria collezione di carte
- Verificare quali deck possono essere costruiti in base alla collezione
- Trovare carte mancanti e prezzi
- Esportare liste e wishlist

---

## 🔧 Tecnologie

- React + Vite
- Context API (`DeckContext`) per la gestione globale dello stato
- Backend Express per persistenza collezione e chiamate proxy
- API Scryfall (dati carte) e CardTrader (wishlist, prezzi)

---

## 📁 Struttura principali delle tab

### 📃 Collezione

- Caricamento collezione da `.txt` o ricerca fuzzy
- Visualizzazione in griglia con immagine, quantità e prezzo
- Aggiunta/rimozione carte dinamica
- Dettaglio carta con prezzi da CardTrader
- Salvataggio su backend via API REST

### 🧮 Matching

- Confronto tra la collezione e oltre 70.000 mazzi Commander (da file JSONL suddivisi)
- Filtraggio per percentuale minima di completamento (slider)
- Raggruppamento per comandante
- Espansione inline dei mazzi per vedere le carte mancanti
- Esportazione TXT delle mancanti

### 🔗 Match da Lista

- Incolla una lista testuale di carte (es. da Moxfield)
- Confronta con la collezione
- Esporta mancanti in `.txt` o crea wishlist automatica su CardTrader

---

## 🚀 Funzionalità pianificate (Deck Builder)

> In fase di sviluppo

- Costruzione mazzi Commander da zero
- Analisi della curva di mana e archetipi
- Suggerimenti di carte da EDHREC
- Integrazione video YouTube per il comandante scelto
- Salvataggio e esportazione mazzi personalizzati
- English Language

---

## 📁 Dataset inclusi

- `scryfall-min.json`: bulk ridotto delle carte con `name`, `image`, `price`, `colors`, `type`, ecc.
- `public/decks_split/*.jsonl`: oltre 77.000 mazzi Commander da Moxfield (filtrati e preprocessati)

---

## 🚫 Blacklist e filtri

- Deck cEDH esclusi tramite regex nel nome (`/cedh/i`)
- Mazzi con meno di 95 carte scartati
- Sistema di blacklist per carte fastidiose (feature futura)

---

## 📅 Stato attuale

- Frontend completo e stabile per visualizzazione collezione e matching
- Persistenza collezione in backend completata
- Tutto funzionante anche in locale, senza rate limit

---

## 🚀 Avvio del progetto

```bash
npm install
npm run dev
```

---

## 💪 Autore

**Nicco** – mtg enthusiast, fullstack dev, data nerd.

