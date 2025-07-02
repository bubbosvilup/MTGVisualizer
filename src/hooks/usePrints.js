import { useState, useEffect } from 'react';

let cachedData = null;
let fetching = null;

async function loadData() {
  const res = await fetch('/api/scryfall/prints');
  if (!res.ok) {
    throw new Error(`Failed to load prints data: ${res.status}`);
  }
  return res.json();
}

export default function usePrints() {
  const [data, setData] = useState(cachedData);

  useEffect(() => {
    if (cachedData) return setData(cachedData);

    if (!fetching) {
      fetching = loadData()
        .then((json) => {
          cachedData = json;
          return json;
        })
        .catch((err) => {
          console.error('❌ Failed to fetch prints data', err);
          return [];
        });
    }

    fetching.then(setData);
  }, []);

  return data || [];
}
