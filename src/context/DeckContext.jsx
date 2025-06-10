import { createContext, useState } from 'react';

const DeckContext = createContext();

export function DeckProvider({ children }) {
  const [decks, setDecks] = useState([]);
  const [collection, setCollection] = useState([]);

  return (
    <DeckContext.Provider value={{ decks, setDecks, collection, setCollection }}>
      {children}
    </DeckContext.Provider>
  );
}

export default DeckContext;
