/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
require('dotenv').config();
const { fetchBlueprint, fetchProducts, computePriceStats } = require('../utils/cardtraderApi');

router.get('/:cardName', async (req, res) => {
  try {
    const { cardName } = req.params;
    const token = process.env.CARDTRADER_API_TOKEN;

    if (!token) {
      console.error('❌ CardTrader API token not configured');
      return res.status(500).json({ error: 'CardTrader API token not configured' });
    }

    console.log(`[CardTrader] Fetching blueprint for: ${cardName}`);
    const blueprint = await fetchBlueprint(cardName, token);
    if (!blueprint) {
      console.warn(`[CardTrader] No blueprint found for: ${cardName}`);
      return res.json({ error: true, message: 'Blueprint not found' });
    }
    const blueprintId = blueprint.id;
    console.log(`[CardTrader] Using blueprint: ${blueprint.name} (id: ${blueprintId})`);
    // Fetch marketplace products for this blueprint
    console.log(`[CardTrader] Fetching products for blueprintId: ${blueprintId}`);
    console.log(`[CardTrader] Fetching products for blueprintId: ${blueprintId}`);
    const productsData = await fetchProducts(blueprintId, token);
    const { minPrice, maxPrice, avgPrice } = computePriceStats(productsData);

    console.log(`[CardTrader] Products found: ${productsData.length}. Prices computed`);

    // Risposta
    const response = {
      blueprint_id: blueprintId,
      name: blueprint.name,
      min_price: minPrice,
      avg_price: avgPrice,
      max_price: maxPrice,
      products: productsData.slice(0, 10).map((p) => ({
        price: p.price,
        condition: p.condition,
        language: p.language,
        seller_name: p.seller_name,
        url: p.url,
      })),
    };
    res.json(response);
  } catch (error) {
    console.error('[CardTrader API error]:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

module.exports = router;
