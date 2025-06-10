const fs = require('fs');
const path = require('path');
const readline = require('readline');

const INPUT_FILE = path.join(__dirname, 'public', 'decks.jsonl');
const OUTPUT_DIR = path.join(__dirname, 'public', 'decks_split');
const CHUNK_SIZE = 10000;

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

let lineCount = 0;
let fileIndex = 1;
let currentLines = [];

const rl = readline.createInterface({
  input: fs.createReadStream(INPUT_FILE),
  crlfDelay: Infinity,
});

rl.on('line', (line) => {
  if (line.trim()) {
    currentLines.push(line);
    lineCount++;
  }

  if (currentLines.length === CHUNK_SIZE) {
    const filePath = path.join(OUTPUT_DIR, `decks-${fileIndex}.jsonl`);
    fs.writeFileSync(filePath, currentLines.join('\n'), 'utf-8');
    console.log(`✅ Creato ${filePath}`);
    fileIndex++;
    currentLines = [];
  }
});

rl.on('close', () => {
  if (currentLines.length > 0) {
    const filePath = path.join(OUTPUT_DIR, `decks-${fileIndex}.jsonl`);
    fs.writeFileSync(filePath, currentLines.join('\n'), 'utf-8');
    console.log(`✅ Creato ${filePath}`);
  }
  console.log(`🎉 Completato! Suddivise ${lineCount} righe in ${fileIndex} file.`);
});
