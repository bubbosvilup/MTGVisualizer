# MTG Visualizer

MTG Visualizer è una Single Page Application (SPA) costruita con **React** e **Vite**.
Nasce per aiutare i giocatori di Magic: The Gathering (formato Commander) a:

Gestire la propria collezione di carte

- Scoprire quali mazzi possono essere montati con le carte possedute
- Recuperare prezzi e carte mancanti
- Esportare liste e wishlist

---

## 🔧 Tecnologie

- React + Vite
- Context API (`DeckContext`) per la gestione globale dello stato
- Backend Express per persistenza collezione e chiamate proxy
- API Scryfall (dati carte) e CardTrader (wishlist, prezzi)

---

## 📁 Sezioni principali

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

## 🔮 Piani futuri

> In fase di sviluppo

- Creazione di mazzi Commander da zero con salvataggio persistente [75%]
- Analisi dinamica di curve di mana, archetipi e sinergie [60%]
- Suggerimenti basati su EDHREC [not started]
- Integrazione di video YouTube per i comandanti [not started]
- Wishlist automatizzate e gestione dei preferiti [not started]
- Possibilità di usare l'interfaccia in inglese [not started]

---

## 📁 Dataset inclusi

- `scryfall-min.json`: bulk ridotto delle carte con `name`, `image`, `price`, `colors`, `type`, ecc.
- `public/decks_split/*.jsonl`: oltre 77.000 mazzi Commander da Moxfield (filtrati e preprocessati)

---

## 🚫 Blacklist e filtri

- Deck cEDH esclusi tramite regex nel nome (`/cedh/i`)
- Mazzi con meno di 95 carte scartati
- Sistema di blacklist per carte sgradite (in sviluppo)

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

nel caso in cui il server non sia up (probabile)
prima di runnare il front:

```bash
cd server
node index.js
```

per avere anche la funzione di export della wishlist in automatico
create un .env nella root e dentro metteteci:

```bash
VITE_CARDTRADER_TOKEN= la vostra key di CardTrader
```

l'env che create sarà già presente nel .gitignore quindi siete nel chill

---

## 💪 Autore

**Nicco** MTG enthusiast, fullstack dev, data nerd.
[Hail the OpenSource]

