// utils/parseCollection.js
export function parseCollectionFromText(text) {
  const lines = text.split('\n');
  const collection = {};

  for (let rawLine of lines) {
    let line = rawLine.trim().toLowerCase();
    if (!line) continue;

    // Rimuove set in parentesi (CLB), ma non tocca il nome
    line = line.replace(/\(.*?\)/g, '').trim();

    // Estrai quantità e nome
    const match = line.match(/^(\d+)[x\s]*([\w\s'\/:,!?.-]+)$/i);
    if (!match) continue;

    const qty = parseInt(match[1]);
    const name = match[2].trim();

    if (!name) continue;

    collection[name] = (collection[name] || 0) + qty;
  }

  return collection;
}

export default parseCollectionFromText;
