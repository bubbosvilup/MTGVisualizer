const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, 'public', 'decks_backup');
const TARGET_DIR = path.join(__dirname, 'public', 'decks_split');

fs.readdirSync(BACKUP_DIR).forEach((file) => {
  if (!file.endsWith('.jsonl')) return;

  const from = path.join(BACKUP_DIR, file);
  const to = path.join(TARGET_DIR, file);
  fs.copyFileSync(from, to);
  console.log(`🔁 Ripristinato ${file}`);
});

console.log('✅ Tutti i file sono stati ripristinati dalla cartella backup.');
