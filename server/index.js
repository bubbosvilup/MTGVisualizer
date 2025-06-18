// server/index.js
/* eslint-disable no-undef */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const collectionRoutes = require('./routes/collection');
const cardtraderRoutes = require('./routes/cardtrader');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/collection', collectionRoutes);
app.use('/api/cardtrader', cardtraderRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server backend in ascolto su http://localhost:${PORT}`);
});
