// src/context/DeckContext.jsx
import { createContext, useState } from 'react';

const DeckContext = createContext();

export function DeckProvider({ children }) {
  const [decks, setDecks] = useState([]);
  const [collection, setCollection] = useState([]);
  const [loadingDecks, setLoadingDecks] = useState(true); // 👈 aggiunto

  return (
    <DeckContext.Provider
      value={{
        decks,
        setDecks,
        collection,
        setCollection,
        loadingDecks,
        setLoadingDecks,
      }}
    >
      {children}
    </DeckContext.Provider>
  );
}

export default DeckContext;
