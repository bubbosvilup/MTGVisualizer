import { useState, useEffect } from 'react';

let cachedData = null;
let fetching = null;

async function loadData() {
  const res = await fetch('/api/scryfall/min');
  if (!res.ok) {
    throw new Error(`Failed to load scryfall data: ${res.status}`);
  }
  return res.json();
}

export default function useScryfall() {
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
          console.error('❌ Failed to fetch scryfall data', err);
          return [];
        });
    }

    fetching.then(setData);
  }, []);

  return data || [];
}
