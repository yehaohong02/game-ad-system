const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const ssDir = path.join(__dirname, '..', 'data', 'screenshots');
if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });

const userDataDir = path.join(__dirname, '..', 'data', 'electron-dataeye');
app.setPath('userData', userDataDir);

let win;
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function ss(name) {
  const img = await win.webContents.capturePage();
  const p = path.join(ssDir, `${name}.png`);
  fs.writeFileSync(p, img.toPNG());
  console.log(`Screenshot: ${p}`);
}
async function getPageInfo() {
  return await win.webContents.executeJavaScript(`({
    url: location.href,
    title: document.title,
    text: (document.body?.innerText || '').substring(0, 500),
  })`);
}

app.whenReady().then(async () => {
  win = new BrowserWindow({
    width: 1400, height: 900,
    webPreferences: { contextIsolation: false },
  });

  console.log('Opening DataEye...');
  await win.loadURL('https://adxray.dataeye.com');
  await sleep(5000);

  const info = await getPageInfo();
  console.log('URL:', info.url);

  const isLoginPage = info.text.includes('登 录') || info.text.includes('登录');
  if (isLoginPage) {
    console.log('Login page detected. Waiting for manual login...');
    console.log('Please log in the Electron window, then the script will auto-continue.');

    // Poll for 120 seconds until URL changes or login form disappears
    for (let i = 0; i < 60; i++) {
      await sleep(2000);
      const check = await getPageInfo();
      const stillLogin = check.text.includes('登 录') && check.text.includes('请输入邮箱');
      if (!stillLogin) {
        console.log('Login detected! URL:', check.url);
        await sleep(3000);
        break;
      }
      if (i % 5 === 0) console.log(`Still waiting... (${i * 2}s)`);
    }
  }

  await ss('de_dashboard');
  const dashInfo = await getPageInfo();
  console.log('\n=== Dashboard ===');
  console.log('URL:', dashInfo.url);
  console.log('Title:', dashInfo.title);

  // Get all navigable pages
  const menuData = await win.webContents.executeJavaScript(`
    (function() {
      const result = { menuItems: [], links: [] };

      // Sidebar menu
      document.querySelectorAll('.ant-menu-item, .ant-menu-submenu, [class*="sider"] a, [class*="sidebar"] a').forEach(el => {
        const text = el.textContent?.trim();
        const href = el.querySelector('a')?.href || el.closest('a')?.href || '';
        if (text && text.length < 30 && text.length > 0) {
          result.menuItems.push({ text, href });
        }
      });

      // All page links
      document.querySelectorAll('a[href*="dataeye"]').forEach(a => {
        result.links.push({ text: a.textContent?.trim()?.substring(0, 40), href: a.href });
      });

      return result;
    })()
  `);

  console.log('\n=== Menu Items ===');
  const seen = new Set();
  menuData.menuItems.forEach(m => {
    const key = m.text + m.href;
    if (!seen.has(key) && m.text) {
      seen.add(key);
      console.log(`  ${m.text} → ${m.href}`);
    }
  });

  console.log('\n=== Top Links ===');
  menuData.links.slice(0, 20).forEach(l => {
    if (l.text && !seen.has(l.href)) {
      seen.add(l.href);
      console.log(`  ${l.text} → ${l.href}`);
    }
  });

  // Now navigate to ad library / creative gallery
  console.log('\n=== Navigating to ad library ===');

  // Try common DataEye ad library URLs
  const adLibUrls = [
    'https://adxray.dataeye.com/ad/creative',
    'https://adxray.dataeye.com/ad/library',
    'https://adxray.dataeye.com/creative/library',
    'https://adxray.dataeye.com/product/ranking',
  ];

  // Find from menu
  const adLink = menuData.menuItems.find(m =>
    m.text.includes('素材') || m.text.includes('广告') || m.text.includes('创意') ||
    m.text.includes('library') || m.text.includes('creative') || m.text.includes('ranking')
  );

  if (adLink && adLink.href) {
    console.log('Found ad library link:', adLink.text, '→', adLink.href);
    await win.loadURL(adLink.href);
  } else {
    // Try direct URLs
    for (const tryUrl of adLibUrls) {
      console.log('Trying:', tryUrl);
      await win.loadURL(tryUrl);
      await sleep(4000);
      const tryInfo = await getPageInfo();
      if (!tryInfo.text.includes('登 录') && !tryInfo.url.includes('/index/')) {
        console.log('Success! Loaded:', tryInfo.url);
        break;
      }
    }
  }

  await sleep(5000);
  await ss('de_ad_library');
  const libInfo = await getPageInfo();
  console.log('\nAd library URL:', libInfo.url);
  console.log('Ad library title:', libInfo.title);
  console.log('Page text (first 300):', libInfo.text.substring(0, 300));

  // Extract structured data from the page
  console.log('\n=== Extracting page structure ===');
  const structure = await win.webContents.executeJavaScript(`
    (function() {
      const result = {
        tables: [],
        cards: [],
        images: [],
        videos: [],
      };

      // Ant Design tables
      document.querySelectorAll('.ant-table').forEach((table, ti) => {
        const rows = [];
        table.querySelectorAll('.ant-table-row, tbody tr').forEach((row, ri) => {
          if (ri > 20) return;
          const cells = [];
          row.querySelectorAll('td').forEach(cell => {
            const img = cell.querySelector('img');
            cells.push({
              text: cell.textContent?.trim()?.substring(0, 80),
              img: img?.src?.substring(0, 100) || '',
            });
          });
          if (cells.length > 0) rows.push(cells);
        });
        if (rows.length > 0) result.tables.push({ tableIndex: ti, rowCount: rows.length, sampleRows: rows.slice(0, 5) });
      });

      // Cards
      document.querySelectorAll('.ant-card, [class*="card"]').forEach((card, i) => {
        if (i > 30) return;
        const imgs = [...card.querySelectorAll('img')].map(img => img.src).filter(s => s && !s.startsWith('data:'));
        const text = card.textContent?.trim()?.substring(0, 200);
        if (imgs.length > 0 || text.length > 20) {
          result.cards.push({ imgs: imgs.slice(0, 3), text: text.substring(0, 150) });
        }
      });

      // All images
      document.querySelectorAll('img').forEach(img => {
        if (img.src && !img.src.startsWith('data:') && img.naturalWidth > 40) {
          result.images.push(img.src.substring(0, 150));
        }
      });

      // All videos
      document.querySelectorAll('video').forEach(v => {
        const src = v.src || v.querySelector('source')?.src;
        if (src) result.videos.push(src.substring(0, 150));
      });

      return result;
    })()
  `);

  console.log('\nTables found:', structure.tables.length);
  structure.tables.forEach(t => {
    console.log(`  Table ${t.tableIndex}: ${t.rowCount} rows`);
    t.sampleRows.slice(0, 2).forEach(row => {
      console.log('    Row:', row.map(c => c.text?.substring(0, 30)).join(' | '));
    });
  });

  console.log('Cards found:', structure.cards.length);
  structure.cards.slice(0, 5).forEach(c => {
    console.log(`  Card: ${c.text?.substring(0, 80)}`);
    if (c.imgs.length) console.log(`    imgs: ${c.imgs.join(', ')}`);
  });

  console.log('Images found:', structure.images.length);
  structure.images.slice(0, 10).forEach(src => console.log(`  ${src}`));

  console.log('Videos found:', structure.videos.length);
  structure.videos.forEach(src => console.log(`  ${src}`));

  // Save full structure for analysis
  fs.writeFileSync(path.join(ssDir, '..', 'dataeye_structure.json'), JSON.stringify(structure, null, 2));
  console.log('\nStructure saved to data/dataeye_structure.json');

  console.log('\n=== Done. Window kept open for manual browsing. ===');
});
