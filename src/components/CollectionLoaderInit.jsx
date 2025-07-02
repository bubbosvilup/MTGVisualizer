import { useEffect } from 'react';
import { useDecks } from '../context/useDecks';
import useScryfall from '../hooks/useScryfall';
import usePrints from '../hooks/usePrints';

const TOKEN = import.meta.env.VITE_CARDTRADER_TOKEN;

function CollectionLoaderInit() {
  const { setCollection } = useDecks();
  const scryfallData = useScryfall();
  const printsData = usePrints();

  useEffect(() => {
    const fetchCollection = async () => {
      let data = [];
      try {
        const res = await fetch('/api/collection');
        if (!res.ok) {
          throw new Error(`Backend returned ${res.status}`);
        }
        data = await res.json();
      } catch (err) {
        console.error('❌ Errore nel caricamento della collezione dal backend:', err);
        try {
          const res = await fetch('/server/data/collection.json');
          if (!res.ok) {
            throw new Error(`Fallback returned ${res.status}`);
          }
          data = await res.json();
          console.warn('⚠️ Collezione caricata dal file statico collection.json');
        } catch (err2) {
          console.error('❌ Errore anche nel caricamento da collection.json:', err2);
          data = [];
        }
      }
      const fetchAvgPrice = async (blueprintId) => {
        try {
          const url = `https://api.cardtrader.com/api/v2/marketplace/products?blueprint_id=${blueprintId}`;
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
              Accept: 'application/json',
            },
          });
          const data = await res.json();
          const offers = data[String(blueprintId)] || [];
          const prices = offers
            .slice(0, 5)
            .map((o) => o.price?.cents)
            .filter((c) => typeof c === 'number')
            .map((c) => c / 100);
          const price =
            prices.length > 0
              ? parseFloat((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2))
              : null;
          return price;
        } catch (err) {
          console.error('❌ Errore fetch prezzo init:', err);
          return null;
        }
      };

      const enriched = [];
      for (const entry of data) {
        const match = scryfallData.find(
          (card) => card.name.toLowerCase() === entry.name.toLowerCase()
        );
        const printsEntry = printsData.find(
          (p) => p.name.toLowerCase() === entry.name.toLowerCase()
        );
        const preferred = printsEntry?.prints.find((p) => p.set === entry.preferredSet);
        const first = printsEntry?.prints[0];
        const image = preferred?.image || first?.image || match?.image || '';
        const blueprint = preferred?.blueprint || first?.blueprint;
        let price = entry.price ?? match?.price ?? null;
        if (price == null && entry.preferredBlueprint) {
          price = await fetchAvgPrice(entry.preferredBlueprint);
          if (price !== null) {
            try {
              await fetch('/api/collection', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: entry.name, price }),
              });
            } catch (err) {
              console.error('❌ Errore aggiornamento prezzo backend:', err);
            }
          }
        }
        enriched.push({
          ...entry,
          name: entry.name,
          image,
          preferredBlueprint: entry.preferredBlueprint || blueprint,
          price,
          colors: match?.colors || [],
          type: match?.type || '',
        });
      }
      setCollection(enriched);
    };
    fetchCollection();
  }, [setCollection, scryfallData, printsData]);

  return null;
}

export default CollectionLoaderInit;
