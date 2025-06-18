/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
require('dotenv').config();

router.get('/:cardName', async (req, res) => {
  try {
    const { cardName } = req.params;
    const token = process.env.CARDTRADER_API_TOKEN;

    if (!token) {
      console.error('❌ CardTrader API token not configured');
      return res.status(500).json({ error: 'CardTrader API token not configured' });
    }

    console.log(`[CardTrader] Fetching blueprint for: ${cardName}`);
    const blueprintRes = await fetch(
      `https://api.cardtrader.com/api/v2/blueprints?name=${encodeURIComponent(cardName)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    if (!blueprintRes.ok) {
      console.error(
        `[CardTrader] Blueprint fetch failed: ${blueprintRes.status} ${blueprintRes.statusText}`
      );
      throw new Error(`Blueprint fetch failed: ${blueprintRes.statusText}`);
    }
    const blueprints = await blueprintRes.json();
    console.log(
      `[CardTrader] Blueprints found: ${Array.isArray(blueprints) ? blueprints.length : 0}`
    );
    if (!Array.isArray(blueprints) || blueprints.length === 0) {
      console.warn(`[CardTrader] No blueprint found for: ${cardName}`);
      return res.json({ error: true, message: 'Blueprint not found' });
    }
    // Matcha per nome esatto (case-insensitive), altrimenti prendi il primo
    const blueprint =
      blueprints.find((b) => b.name?.toLowerCase() === cardName.toLowerCase()) || blueprints[0];
    const blueprintId = blueprint.id;
    console.log(`[CardTrader] Using blueprint: ${blueprint.name} (id: ${blueprintId})`);

    // Fetch marketplace products for this blueprint
    console.log(`[CardTrader] Fetching products for blueprintId: ${blueprintId}`);
    const productsRes = await fetch(
      `https://api.cardtrader.com/api/v2/marketplace/products?blueprint_id=${blueprintId}&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );
    if (!productsRes.ok) {
      console.error(
        `[CardTrader] Products fetch failed: ${productsRes.status} ${productsRes.statusText}`
      );
      throw new Error(`Products fetch failed: ${productsRes.statusText}`);
    }
    const productsData = await productsRes.json();
    const prices = productsData.map((p) => p.price).filter((v) => typeof v === 'number');
    const minPrice = prices.length ? Math.min(...prices) : null;
    const maxPrice = prices.length ? Math.max(...prices) : null;
    const avgPrice = prices.length ? prices.reduce((sum, v) => sum + v, 0) / prices.length : null;

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
