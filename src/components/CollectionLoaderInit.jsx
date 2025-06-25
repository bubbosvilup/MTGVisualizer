import { useEffect } from 'react';
import { useDecks } from '../context/useDecks';
import scryfallData from '../data/scryfall-min.json';

function CollectionLoaderInit() {
  const { setCollection } = useDecks();

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
      const enriched = data.map((entry) => {
        const match = scryfallData.find(
          (card) => card.name.toLowerCase() === entry.name.toLowerCase()
        );
        return {
          ...entry,
          name: entry.name,
          image: match?.image || '',
          price: typeof match?.price === 'number' ? match.price : null,
          colors: match?.colors || [],
          type: match?.type || '',
        };
      });
      setCollection(enriched);
    };
    fetchCollection();
  }, [setCollection]);

  return null;
}

export default CollectionLoaderInit;
