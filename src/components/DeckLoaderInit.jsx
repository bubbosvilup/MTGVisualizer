// src/components/DeckLoaderInit.jsx
import { useEffect, useState } from 'react';
import { useDecks } from '../context/useDecks';
import '../styles/DeckLoaderInit.css';

function DeckLoaderInit() {
  const { decks, setDecks, setLoadingDecks } = useDecks();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const loadDecks = async () => {
      setLoadingDecks(true); // 👈 inizio caricamento
      const totalFiles = 8;
      const temp = [];

      for (let i = 1; i <= totalFiles; i++) {
        try {
          const res = await fetch(`/decks_split/decks-${i}.jsonl`);
          const text = await res.text();
          const lines = text.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (Array.isArray(parsed.cards) && !/cedh/i.test(parsed.name || '')) {
                temp.push(parsed);
              }
            } catch (err) {
              console.warn('Errore JSON:', err);
            }
          }
        } catch (err) {
          console.error('Errore fetch:', err);
        }
      }

      setDecks(temp);
      setLoadingDecks(false); // ✅ fine caricamento
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    if (decks.length === 0) {
      loadDecks();
    }
  }, [decks.length, setDecks, setLoadingDecks]);

  return showToast ? (
    <div className="toast-toast">
      ✅ {decks.length.toLocaleString()} Mazzi caricati con successo
    </div>
  ) : null;
}

export default DeckLoaderInit;
