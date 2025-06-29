const fetch = require('node-fetch');

const BASE_URL = 'https://api.cardtrader.com/api/v2';

function buildHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
}

async function fetchBlueprint(cardName, token) {
  const url = `${BASE_URL}/blueprints?name=${encodeURIComponent(cardName)}`;
  const res = await fetch(url, { headers: buildHeaders(token) });
  if (!res.ok) {
    throw new Error(`Blueprint fetch failed: ${res.statusText}`);
  }
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }
  // Prefer exact match (case-insensitive)
  return data.find((b) => b.name?.toLowerCase() === cardName.toLowerCase()) || data[0];
}

async function fetchProducts(blueprintId, token) {
  const url = `${BASE_URL}/marketplace/products?blueprint_id=${blueprintId}&limit=50`;
  const res = await fetch(url, { headers: buildHeaders(token) });
  if (!res.ok) {
    throw new Error(`Products fetch failed: ${res.statusText}`);
  }
  return res.json();
}

function computePriceStats(products) {
  const prices = products.map((p) => p.price).filter((v) => typeof v === 'number');
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const avgPrice = prices.length ? prices.reduce((sum, v) => sum + v, 0) / prices.length : null;
  return { minPrice, maxPrice, avgPrice };
}

module.exports = {
  fetchBlueprint,
  fetchProducts,
  computePriceStats,
};
