// server/data/collection.js
/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'collection.json');
let collection = [];

// 📥 Carica dal file all'avvio
function loadFromDisk() {
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8').trim();
      if (!raw || raw === '') {
        console.warn('⚠️ File collection.json vuoto, inizializzo collezione vuota');
        collection = [];
      } else {
        collection = JSON.parse(raw);
        console.log(`📂 Collezione caricata da ${filePath} (${collection.length} carte)`);
      }
    } catch (err) {
      console.error('❌ Errore nel parsing di collection.json:', err);
      collection = [];
    }
  } else {
    console.log('ℹ️ Nessun file collection.json trovato. Collezione vuota.');
    collection = [];
  }
}

// 💾 Salva su disco ogni volta che cambia
function saveToDisk() {
  try {
    fs.writeFileSync(filePath, JSON.stringify(collection, null, 2), 'utf-8');
    console.log(`💾 Collezione salvata in ${filePath}`);
  } catch (err) {
    console.error('❌ Errore nel salvataggio di collection.json:', err);
  }
}

// Accessors
function getCollection() {
  return collection;
}

function setCollection(newData) {
  collection = newData;
  saveToDisk();
}

function updateCard(name, qty) {
  const index = collection.findIndex((c) => c.name.toLowerCase() === name.toLowerCase());
  if (index !== -1) {
    collection[index].qty = qty;
  } else {
    collection.push({ name, qty });
  }
  saveToDisk();
}

// ⚙️ Carica all'avvio del server
loadFromDisk();

module.exports = {
  getCollection,
  setCollection,
  updateCard,
};
