const { Level } = require('level');
const path = require('path');
const fs = require('fs');

const dbPath = 'C:/Users/hongyeli/AppData/Roaming/game-ad-desktop-frontend/Local Storage/leveldb';
const outputDir = path.join(__dirname, '..', 'data');

function extractFields(objStr) {
  const item = {};
  // Extract known fields using regex
  const fields = {
    type: /"type"\s*:\s*"([^"]*)"/,
    creativeType: /"creativeType"\s*:\s*"([^"]*)"/,
    creativeUrl: /"creativeUrl"\s*:\s*"([^"]*)"/,
    source: /"source"\s*:\s*"([^"]*)"/,
    pageUrl: /"pageUrl"\s*:\s*"([^"]*)"/,
    crawledAt: /"crawledAt"\s*:\s*"([^"]*)"/,
    id: /"id"\s*:\s*"([^"]*)"/,
  };

  for (const [key, regex] of Object.entries(fields)) {
    const m = objStr.match(regex);
    if (m) item[key] = m[1];
  }

  // Extract adText (may contain special chars, extract between quotes)
  const adTextMatch = objStr.match(/"adText"\s*:\s*"([^"]*?)"/);
  if (adTextMatch) item.adText = adTextMatch[1];

  // Extract advertiser
  const advMatch = objStr.match(/"advertiser"\s*:\s*"([^"]*?)"/);
  if (advMatch) item.advertiser = advMatch[1];

  // Extract gameName
  const gameMatch = objStr.match(/"gameName"\s*:\s*"([^"]*?)"/);
  if (gameMatch) item.gameName = gameMatch[1];

  // Extract country
  const countryMatch = objStr.match(/"country"\s*:\s*"([^"]*?)"/);
  if (countryMatch) item.country = countryMatch[1];

  return item;
}

async function main() {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const db = new Level(dbPath, { valueEncoding: 'buffer' });

  for await (const [key, value] of db.iterator()) {
    const keyStr = key.toString('utf8');
    if (!keyStr.includes('browser_crawledItems')) continue;

    console.log(`Found: ${(value.length / 1024).toFixed(0)} KB`);

    // Decode as UTF-16BE
    let decoded = '';
    for (let i = 0; i < value.length - 1; i += 2) {
      decoded += String.fromCharCode((value[i] << 8) | value[i + 1]);
    }
    if (decoded.charCodeAt(0) === 0xFEFF) decoded = decoded.substring(1);

    // Extract all objects by brace matching
    const items = [];
    let depth = 0, objStart = -1;
    for (let i = 0; i < decoded.length; i++) {
      if (decoded[i] === '{') {
        if (depth === 0) objStart = i;
        depth++;
      } else if (decoded[i] === '}') {
        depth--;
        if (depth === 0 && objStart >= 0) {
          const objStr = decoded.substring(objStart, i + 1);
          const item = extractFields(objStr);
          if (item.creativeUrl || item.adText || item.source) {
            items.push(item);
          }
          objStart = -1;
        }
      }
    }

    console.log(`Extracted ${items.length} items`);

    // Deduplicate
    const seen = new Set();
    const unique = items.filter(item => {
      const key = item.creativeUrl || (item.adText || '').substring(0, 50) + item.source;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    unique.forEach((item, idx) => { if (!item.id) item.id = `item-${idx}`; });

    fs.writeFileSync(path.join(outputDir, 'crawledItems.json'), JSON.stringify(unique, null, 2), 'utf-8');
    console.log(`Saved ${unique.length} unique items`);

    // Analysis
    const sources = {};
    unique.forEach(i => { sources[i.source || 'unknown'] = (sources[i.source || 'unknown'] || 0) + 1; });
    console.log('Sources:', sources);

    const types = {};
    unique.forEach(i => { types[i.creativeType || 'unknown'] = (types[i.creativeType || 'unknown'] || 0) + 1; });
    console.log('Types:', types);

    const advertisers = {};
    unique.forEach(i => { if (i.advertiser) advertisers[i.advertiser] = (advertisers[i.advertiser] || 0) + 1; });
    const advSorted = Object.entries(advertisers).sort((a, b) => b[1] - a[1]);
    console.log(`Advertisers: ${advSorted.length}`);
    advSorted.slice(0, 20).forEach(([n, c]) => console.log(`  ${n}: ${c}`));

    // Show sample item
    console.log('\nSample item:', JSON.stringify(unique[0], null, 2));
    break;
  }

  await db.close();
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
