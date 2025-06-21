const fs = require('fs');

const data = JSON.parse(fs.readFileSync('archetypes-guidelines-standardized.json', 'utf8'));

console.log(Object.keys(data).length);
