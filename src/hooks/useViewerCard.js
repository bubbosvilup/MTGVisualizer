import { useMemo } from 'react';
import useScryfall from './useScryfall';

export default function useViewerCard(selectedCard) {
  const scryfallData = useScryfall();

  return useMemo(() => {
    if (!selectedCard) return null;
    const match = scryfallData.find(
      (c) => c.name.toLowerCase() === selectedCard.name.toLowerCase()
    );
    const base = match || selectedCard;
    return {
      ...base,
      image_uris: { normal: base.image_uris?.normal || base.image },
      type_line: base.type_line || base.type,
      prices: { eur: base.prices?.eur ?? base.price },
    };
  }, [selectedCard, scryfallData]);
}
