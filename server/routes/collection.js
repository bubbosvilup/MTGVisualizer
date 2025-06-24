// server/routes/collection.js
/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const { getCollection, setCollection, updateCard } = require('../data/collection');

// GET /api/collection
router.get('/', (req, res) => {
  res.json(getCollection());
});

// POST /api/collection (sovrascrive tutto)
router.post('/', (req, res) => {
  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'Formato non valido: deve essere un array di carte' });
  }
  setCollection(data);
  res.json({ message: 'Collezione aggiornata', count: data.length });
});

// PATCH /api/collection (aggiunge/aggiorna singola carta)
router.patch('/', (req, res) => {
  const { name, qty } = req.body;
  if (!name || typeof qty !== 'number') {
    return res.status(400).json({ error: 'Richiesta non valida. Servono name e qty' });
  }
  updateCard(name, qty);
  res.json({ message: 'Carta aggiornata o aggiunta', name, qty });
});

// DELETE /api/collection (svuota la collezione)
router.delete('/', (req, res) => {
  setCollection([]);
  res.json({ message: 'Collezione svuotata' });
});

module.exports = router;
