const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(__dirname, 'public', 'decks_split');
const BACKUP_DIR = path.join(__dirname, 'public', 'decks_backup');
const MIN_CARDS = 95;

// Crea backup se non esiste
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

fs.readdirSync(INPUT_DIR).forEach((file) => {
  if (!file.endsWith('.jsonl')) return;

  const inputPath = path.join(INPUT_DIR, file);
  const backupPath = path.join(BACKUP_DIR, file);

  fs.copyFileSync(inputPath, backupPath);

  const lines = fs.readFileSync(inputPath, 'utf-8').split('\n').filter(Boolean);

  let kept = 0;
  const filtered = lines.filter((line) => {
    try {
      const obj = JSON.parse(line);
      if (Array.isArray(obj.cards) && obj.cards.length >= MIN_CARDS) {
        kept++;
        return true;
      }
    } catch {
      return false;
    }
    return false;
  });

  fs.writeFileSync(inputPath, filtered.join('\n'), 'utf-8');
  console.log(`✅ ${file}: mantenuti ${kept}/${lines.length} deck`);
});

console.log('🎯 Filtraggio completato. Backup creato in decks_backup/');
