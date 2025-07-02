import { useMemo } from 'react';
import useScryfall from './useScryfall';

export default function useViewerCard(selectedCard) {
  const scryfallData = useScryfall();

  return useMemo(() => {
    if (!selectedCard) return null;
    const match = scryfallData.find(
      (c) => c.name.toLowerCase() === selectedCard.name.toLowerCase()
    );
    const merged = match ? { ...match, ...selectedCard } : selectedCard;
    return {
      ...merged,
      image_uris: { normal: merged.image_uris?.normal || merged.image },
      type_line: merged.type_line || merged.type,
      prices: { eur: merged.prices?.eur ?? merged.price },
    };
  }, [selectedCard, scryfallData]);
}
