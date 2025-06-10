import { useContext } from 'react';
import DeckContext from './DeckContext';

export function useDecks() {
  return useContext(DeckContext);
}
