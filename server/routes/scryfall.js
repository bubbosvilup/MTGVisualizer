// server/routes/scryfall.js
/* eslint-disable no-undef */
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const minPath = path.join(__dirname, '..', 'data', 'scryfall-min.json');
const maxPath = path.join(__dirname, '..', 'data', 'scryfall-max.json');

let minCache = null;
let maxCache = null;

function loadData(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

router.get('/min', (req, res) => {
  try {
    if (!minCache) minCache = loadData(minPath);
    res.json(minCache);
  } catch (err) {
    console.error('❌ Failed to read scryfall-min.json:', err);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

router.get('/max', (req, res) => {
  try {
    if (!maxCache) maxCache = loadData(maxPath);
    res.json(maxCache);
  } catch (err) {
    console.error('❌ Failed to read scryfall-max.json:', err);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

module.exports = router;
