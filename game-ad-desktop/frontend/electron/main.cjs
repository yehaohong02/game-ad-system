const { app, BrowserWindow, BrowserView, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;
let popupWindow = null; // 独立浏览器窗口（替代 BrowserView 抽屉）
let isDev = !app.isPackaged;
let crawlAbort = false;

function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
    title: '游戏买量系统',
    backgroundColor: '#0f172a',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (popupWindow && !popupWindow.isDestroyed()) popupWindow.close();
    popupWindow = null;
  });
}

// 打开独立浏览器窗口
function ensurePopupWindow() {
  if (popupWindow && !popupWindow.isDestroyed()) return popupWindow;

  popupWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    title: '浏览器 - 游戏买量系统',
    backgroundColor: '#ffffff',
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
    },
  });

  // Auto-fill DataEye credentials
  popupWindow.webContents.on('did-finish-load', () => {
    const url = popupWindow.webContents.getURL();
    if (url.includes('dataeye.com') && (url.includes('/index/') || url.includes('/login'))) {
      setTimeout(() => {
        popupWindow.webContents.executeJavaScript(`
          (function() {
            function setVal(el, val) {
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
              setter.call(el, val);
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }
            const email = document.getElementById('accountId');
            const pwd = document.getElementById('password');
            if (email && !email.value) setVal(email, 'ADX@ewan.cn');
            if (pwd && !pwd.value) setVal(pwd, 'Eworld@123456');
            const cb = document.getElementById('isAgree');
            if (cb && !cb.checked) cb.click();
          })()
        `).catch(() => {});
      }, 3000);
    }
  });

  popupWindow.on('closed', () => { popupWindow = null; });
  return popupWindow;
}

// ========== DataEye-Specific Extraction Script ==========
const DATAEYE_EXTRACT_SCRIPT = `
(function() {
  const items = [];
  const seen = new Set();
  const pageUrl = location.href;
  const pageTitle = document.title;
  const now = new Date().toISOString();
  const source = 'DataEye';

  function dedup(key) {
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }

  // Detect page type from URL
  let pageType = 'unknown';
  let productId = '';
  const urlMatch = pageUrl.match(/product\\/(\\d+)/);
  if (urlMatch) { productId = urlMatch[1]; pageType = 'product'; }
  if (pageUrl.includes('/dashboard/')) { pageType = 'dashboard'; }
  if (pageUrl.includes('/ranking')) { pageType = 'ranking'; }
  if (pageUrl.includes('/creative')) { pageType = 'creative_list'; }

  // Extract game name from page header (Ant Design PageHeader)
  let gameName = '';
  const headerEl = document.querySelector('.ant-page-header-heading-title, h1, [class*="page-header"] h1, [class*="product-name"], [class*="game-name"]');
  if (headerEl) gameName = headerEl.textContent.trim();

  // Extract breadcrumb for category
  let gameCategory = '';
  const breadcrumbItems = document.querySelectorAll('.ant-breadcrumb-link, .ant-breadcrumb a');
  if (breadcrumbItems.length > 1) {
    gameCategory = breadcrumbItems[breadcrumbItems.length - 2]?.textContent?.trim() || '';
  }

  // ===== Extract from Ant Design Table rows =====
  document.querySelectorAll('.ant-table-tbody tr, .ant-table-row').forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length < 2) return;

    const rowText = row.textContent.trim();
    const key = 'row:' + rowText.substring(0, 80);
    if (!dedup(key)) return;

    // Try to find advertiser name (usually first or second column)
    let advertiser = '';
    const nameLink = row.querySelector('a[class*="name"], a[href*="product"], [class*="advertiser"], td:first-child a, td:nth-child(2) a');
    if (nameLink) advertiser = nameLink.textContent.trim();

    // Try to find impression/曝光 count
    let impressions = '';
    const numCells = [...cells];
    for (const cell of numCells) {
      const t = cell.textContent.trim();
      if (/^[\\d,\\.]+[万亿KkMm]?$/.test(t) && t.length < 20) {
        if (!impressions) impressions = t;
      }
    }

    // Try to find country/region tag
    let country = '';
    const tags = row.querySelectorAll('.ant-tag, [class*="tag"]');
    tags.forEach(tag => {
      const t = tag.textContent.trim();
      if (t.length < 30) country += (country ? ', ' : '') + t;
    });

    // Find images/videos in this row
    const imgs = row.querySelectorAll('img[src*="dataeye"], img[src*="material"], img[src]');
    const vids = row.querySelectorAll('video, source');

    // Extract links for follow-up
    const productLink = row.querySelector('a[href*="product"]');
    if (productLink) {
      const hrefMatch = productLink.href.match(/product\\/(\\d+)/);
      if (hrefMatch) productId = productId || hrefMatch[1];
    }

    // If row has images, create creative items
    imgs.forEach(img => {
      if (!img.src || img.src.startsWith('data:') || img.naturalWidth < 40) return;
      const imgUrl = img.src.split('?')[0];
      if (!dedup('img:' + imgUrl)) return;
      items.push({
        type: 'creative', creativeType: 'image', creativeUrl: img.src,
        advertiser: advertiser || 'Product_' + productId,
        gameName: gameName || '',
        gameCategory, country, source, pageUrl, pageType, productId,
        adText: rowText.substring(0, 300), crawledAt: now,
        impressions,
      });
    });

    vids.forEach(v => {
      const src = v.src || v.querySelector('source')?.src;
      if (!src) return;
      if (!dedup('vid:' + src.split('?')[0])) return;
      items.push({
        type: 'creative', creativeType: 'video', creativeUrl: src,
        advertiser: advertiser || 'Product_' + productId,
        gameName: gameName || '',
        gameCategory, country, source, pageUrl, pageType, productId,
        adText: rowText.substring(0, 300), crawledAt: now,
        impressions, rawData: { poster: v.poster || '' },
      });
    });

    // Even rows without media: record as structured ad data
    if (imgs.length === 0 && vids.length === 0 && (advertiser || impressions)) {
      items.push({
        type: 'ad', creativeType: 'text', creativeUrl: '',
        advertiser: advertiser || 'Product_' + productId,
        gameName: gameName || '',
        gameCategory, country, source, pageUrl, pageType, productId,
        adText: rowText.substring(0, 500), crawledAt: now,
        impressions,
      });
    }
  });

  // ===== Extract from Ant Design Cards =====
  document.querySelectorAll('.ant-card, [class*="card"]').forEach(card => {
    const cardText = card.textContent.trim();
    if (cardText.length < 10 || cardText.length > 3000) return;
    const key = 'card:' + cardText.substring(0, 80);
    if (!dedup(key)) return;

    const imgs = card.querySelectorAll('img[src]');
    const vids = card.querySelectorAll('video, source');

    // Extract advertiser from card
    let advertiser = '';
    const advEl = card.querySelector('[class*="name"], [class*="title"], [class*="advertiser"], strong, h3, h4');
    if (advEl && advEl.textContent.trim().length < 100) advertiser = advEl.textContent.trim();

    // Extract metrics (numbers in card)
    let impressions = '';
    const metricEls = card.querySelectorAll('[class*="count"], [class*="num"], [class*="stat"], [class*="value"]');
    metricEls.forEach(el => {
      const t = el.textContent.trim();
      if (/^[\\d,\\.]+[万亿KkMm]?$/.test(t) && !impressions) impressions = t;
    });

    // Extract tags
    let country = '';
    card.querySelectorAll('.ant-tag').forEach(tag => {
      const t = tag.textContent.trim();
      if (t.length < 30) country += (country ? ', ' : '') + t;
    });

    imgs.forEach(img => {
      if (!img.src || img.src.startsWith('data:') || img.naturalWidth < 40) return;
      if (!dedup('img:' + img.src.split('?')[0])) return;
      items.push({
        type: 'creative', creativeType: 'image', creativeUrl: img.src,
        advertiser: advertiser || 'Product_' + productId,
        gameName, gameCategory, country, source, pageUrl, pageType, productId,
        adText: cardText.substring(0, 300), crawledAt: now, impressions,
      });
    });

    vids.forEach(v => {
      const src = v.src || v.querySelector('source')?.src;
      if (!src) return;
      if (!dedup('vid:' + src.split('?')[0])) return;
      items.push({
        type: 'creative', creativeType: 'video', creativeUrl: src,
        advertiser: advertiser || 'Product_' + productId,
        gameName, gameCategory, country, source, pageUrl, pageType, productId,
        adText: cardText.substring(0, 300), crawledAt: now, impressions,
        rawData: { poster: v.poster || '' },
      });
    });
  });

  // ===== Extract standalone images (material thumbnails) =====
  document.querySelectorAll('img').forEach(img => {
    if (!img.src || img.src.startsWith('data:') || img.naturalWidth < 60) return;
    // DataEye material images typically from these CDNs
    if (!img.src.includes('dataeye') && !img.src.includes('material') &&
        !img.src.includes('overseas') && img.naturalWidth < 150) return;
    const key = 'img:' + img.src.split('?')[0];
    if (!dedup(key)) return;

    // Find context: closest card/table row
    const container = img.closest('.ant-card, .ant-table-row, [class*="card"], [class*="item"], [class*="material"]');
    const contextText = container ? container.textContent.trim().substring(0, 300) : '';

    // Try to extract advertiser from context
    let advertiser = '';
    if (container) {
      const advEl = container.querySelector('[class*="name"], [class*="advertiser"], a[href*="product"]');
      if (advEl) advertiser = advEl.textContent.trim();
    }

    items.push({
      type: 'creative', creativeType: 'image', creativeUrl: img.src,
      advertiser: advertiser || 'Product_' + productId,
      gameName, gameCategory, source, pageUrl, pageType, productId,
      adText: contextText, crawledAt: now,
    });
  });

  // ===== Extract standalone videos =====
  document.querySelectorAll('video').forEach(v => {
    const src = v.src || v.querySelector('source')?.src;
    if (!src) return;
    const key = 'vid:' + src.split('?')[0];
    if (!dedup(key)) return;
    const container = v.closest('.ant-card, .ant-table-row, [class*="card"]');
    const contextText = container ? container.textContent.trim().substring(0, 300) : '';
    items.push({
      type: 'creative', creativeType: 'video', creativeUrl: src,
      advertiser: 'Product_' + productId,
      gameName, gameCategory, source, pageUrl, pageType, productId,
      adText: contextText, crawledAt: now,
      rawData: { poster: v.poster || '' },
    });
  });

  // ===== Extract sidebar/metrics for product pages =====
  const metrics = {};
  document.querySelectorAll('.ant-descriptions-item, [class*="stat"], [class*="metric"]').forEach(el => {
    const label = el.querySelector('[class*="label"], .ant-descriptions-item-label, dt')?.textContent?.trim();
    const value = el.querySelector('[class*="value"], .ant-descriptions-item-content, dd')?.textContent?.trim();
    if (label && value) metrics[label] = value;
  });

  // ===== Extract all links =====
  const links = [];
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.href;
    if (href && href.startsWith('http') && !href.includes('javascript:') && !href.includes('#')) {
      links.push({ url: href, text: a.textContent.trim().substring(0, 100) });
    }
  });

  // ===== Page text for context =====
  const bodyClone = document.body.cloneNode(true);
  bodyClone.querySelectorAll('script, style, nav, footer, noscript').forEach(el => el.remove());
  const fullText = bodyClone.innerText.trim().substring(0, 5000);

  return { items, links, fullText, url: pageUrl, title: pageTitle, source: 'DataEye', pageType, productId, gameName, metrics };
})()
`;

// ========== Generic Extraction Script (non-DataEye sites) ==========
const EXTRACT_SCRIPT = `
(function() {
  const items = [];
  const seen = new Set();
  const pageUrl = location.href;
  const pageTitle = document.title;
  const now = new Date().toISOString();

  function dedup(key) {
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }

  // Detect source site
  let source = 'unknown';
  if (pageUrl.includes('facebook.com')) source = 'Facebook';
  else if (pageUrl.includes('tiktok.com')) source = 'TikTok';
  else if (pageUrl.includes('google.com')) source = 'Google';
  else if (pageUrl.includes('guangdada')) source = '广大大';
  else if (pageUrl.includes('appgrowing')) source = 'AppGrowing';
  else if (pageUrl.includes('socialpeta')) source = 'SocialPeta';
  else if (pageUrl.includes('appmagic')) source = 'AppMagic';
  else if (pageUrl.includes('sensortower')) source = 'SensorTower';
  else if (pageUrl.includes('data.ai')) source = 'data.ai';

  // ===== Extract Images =====
  document.querySelectorAll('img').forEach(img => {
    if (!img.src || img.naturalWidth < 80 || img.src.startsWith('data:')) return;
    const key = 'img:' + img.src.split('?')[0];
    if (!dedup(key)) return;
    const parent = img.closest('[class*="card"], [class*="item"], [class*="ad"], [class*="creative"], [class*="result"], [data-testid]');
    const contextText = parent ? parent.textContent.trim().substring(0, 300) : '';
    items.push({
      type: 'creative', creativeType: 'image', creativeUrl: img.src,
      adText: contextText, source, pageUrl, pageTitle, crawledAt: now,
    });
  });

  // ===== Extract Videos =====
  document.querySelectorAll('video').forEach(v => {
    const src = v.src || v.querySelector('source')?.src;
    if (!src) return;
    const key = 'vid:' + src.split('?')[0];
    if (!dedup(key)) return;
    const poster = v.poster || '';
    const parent = v.closest('[class*="card"], [class*="item"], [class*="ad"], [class*="creative"]');
    const contextText = parent ? parent.textContent.trim().substring(0, 300) : '';
    items.push({
      type: 'creative', creativeType: 'video', creativeUrl: src,
      adText: contextText, source, pageUrl, pageTitle, crawledAt: now,
      rawData: { poster, width: v.videoWidth, height: v.videoHeight },
    });
  });

  // ===== Extract Ad Cards (common patterns) =====
  const adSelectors = [
    '[data-testid*="ad"]', '[data-testid*="creative"]', '[data-testid*="result"]',
    '[class*="ad-card"]', '[class*="AdCard"]', '[class*="creative-card"]',
    '[class*="ad-item"]', '[class*="adItem"]', '[class*="result-item"]',
    '[class*="card"]', '[role="article"]',
  ];
  const adSelector = adSelectors.join(', ');
  document.querySelectorAll(adSelector).forEach(card => {
    const text = card.textContent?.trim() || '';
    if (text.length < 20 || text.length > 2000) return;
    const key = 'card:' + text.substring(0, 100);
    if (!dedup(key)) return;

    const img = card.querySelector('img[src*="fbcdn"], img[src*="tiktokcdn"], img[src*="googleusercontent"], img[src]');
    const video = card.querySelector('video');
    const links = [...card.querySelectorAll('a[href]')].map(a => a.href).filter(h => h.startsWith('http'));

    let advertiser = '';
    const nameEl = card.querySelector('[class*="name"], [class*="author"], [class*="brand"], [class*="advertiser"], strong, b');
    if (nameEl && nameEl.textContent.trim().length < 100) advertiser = nameEl.textContent.trim();

    let adText = '';
    const textEl = card.querySelector('[class*="text"], [class*="body"], [class*="content"], [class*="description"], p');
    if (textEl && textEl.textContent.trim().length > 10) adText = textEl.textContent.trim().substring(0, 500);

    let country = '';
    const countryEl = card.querySelector('[class*="country"], [class*="region"], [class*="location"], [class*="market"]');
    if (countryEl) country = countryEl.textContent.trim();

    let platform = '';
    const platformEl = card.querySelector('[class*="platform"], [class*="os"]');
    if (platformEl) platform = platformEl.textContent.trim();

    items.push({
      type: 'ad',
      creativeUrl: img?.src || video?.src || '',
      creativeType: video ? 'video' : img ? 'image' : 'text',
      adText: adText || text.substring(0, 300),
      advertiser, country, platform, source, pageUrl, pageTitle, crawledAt: now,
      rawData: { links: links.slice(0, 5), html: card.outerHTML.substring(0, 500) },
    });
  });

  // ===== Extract Game/App Info =====
  const gameSelectors = [
    '[class*="game"]', '[class*="app"]', '[class*="title"]',
    '[data-testid*="app"]', '[data-testid*="game"]',
  ];
  document.querySelectorAll(gameSelectors.join(', ')).forEach(el => {
    const text = el.textContent?.trim() || '';
    if (text.length < 3 || text.length > 200) return;
    const key = 'game:' + text;
    if (!dedup(key)) return;
    let category = '';
    const catEl = el.closest('[class*="card"], [class*="item"]')?.querySelector('[class*="category"], [class*="genre"], [class*="type"]');
    if (catEl) category = catEl.textContent.trim();
    items.push({
      type: 'game', gameName: text, gameCategory: category,
      source, pageUrl, pageTitle, crawledAt: now,
    });
  });

  const links = [];
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.href;
    if (href && href.startsWith('http') && !href.includes('javascript:') && !href.includes('#')) {
      links.push({ url: href, text: a.textContent.trim().substring(0, 100) });
    }
  });

  const bodyClone = document.body.cloneNode(true);
  bodyClone.querySelectorAll('script, style, nav, footer, noscript').forEach(el => el.remove());
  const fullText = bodyClone.innerText.trim().substring(0, 8000);

  return { items, links, fullText, url: pageUrl, title: pageTitle, source };
})()
`;

// ========== IPC Handlers ==========

ipcMain.handle('browser:navigate', async (_event, url) => {
  try {
    const bv = ensurePopupWindow();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    await bv.webContents.loadURL(url);
    return { success: true, url: bv.webContents.getURL() };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('browser:extract', async (_event, query) => {
  if (!popupWindow) return { success: false, error: '浏览器未打开' };
  try {
    const currentUrl = popupWindow.webContents.getURL();
    // Auto-select DataEye-specific extractor
    const script = currentUrl.includes('dataeye.com') ? DATAEYE_EXTRACT_SCRIPT : EXTRACT_SCRIPT;
    const result = await popupWindow.webContents.executeJavaScript(script);
    return {
      success: true, url: result.url, title: result.title, source: result.source,
      data: result.items, links: result.links, fullText: result.fullText,
      count: result.items.length, timestamp: new Date().toISOString(),
      pageType: result.pageType, productId: result.productId,
      gameName: result.gameName, metrics: result.metrics,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Screenshot: scroll-capture full page, return all parts
ipcMain.handle('browser:screenshot', async (_event, opts = {}) => {
  if (!popupWindow) return { success: false, error: '浏览器未打开' };
  const fs = require('fs');
  const screenshotDir = path.join(__dirname, '..', 'data', 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const timestamp = Date.now();
  const captures = [];

  // Get full page dimensions
  const pageInfo = await popupWindow.webContents.executeJavaScript(`({
    scrollHeight: document.body.scrollHeight,
    scrollWidth: document.body.scrollWidth,
    title: document.title,
    url: location.href,
  })`);

  // Scroll through the full page and capture each viewport
  const viewportHeight = popupWindow.getBounds().height;
  const pageHeight = Math.min(pageInfo.scrollHeight, 20000); // cap at 20k px

  // Scroll to top first
  await popupWindow.webContents.executeJavaScript('window.scrollTo(0, 0)');
  await new Promise(r => setTimeout(r, 500));

  for (let y = 0; y < pageHeight; y += viewportHeight) {
    await popupWindow.webContents.executeJavaScript(`window.scrollTo(0, ${y})`);
    await new Promise(r => setTimeout(r, 600));
    const image = await popupWindow.webContents.capturePage();
    const partNum = Math.floor(y / viewportHeight);
    const partPath = path.join(screenshotDir, `screenshot_${timestamp}_p${partNum}.png`);
    fs.writeFileSync(partPath, image.toPNG());
    captures.push({ path: partPath, index: partNum, scrollY: y });
  }

  // Scroll back to top
  await popupWindow.webContents.executeJavaScript('window.scrollTo(0, 0)');

  // Save metadata
  const meta = {
    url: pageInfo.url, title: pageInfo.title,
    scrollHeight: pageHeight, viewportHeight,
    parts: captures, createdAt: new Date().toISOString(),
  };
  const metaPath = path.join(screenshotDir, `screenshot_${timestamp}_meta.json`);
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

  return { success: true, captures, count: captures.length, dir: screenshotDir, metaPath, title: pageInfo.title };
});

// Download video/media files from current page
ipcMain.handle('browser:downloadMedia', async () => {
  if (!popupWindow) return { success: false, error: '浏览器未打开' };
  try {
    const mediaDir = path.join(__dirname, '..', 'data', 'media');
    const fs = require('fs');
    if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

    // Find all video sources on the page
    const videoUrls = await popupWindow.webContents.executeJavaScript(`
      (function() {
        const urls = new Set();
        document.querySelectorAll('video').forEach(v => {
          if (v.src && !v.src.startsWith('blob:')) urls.add(v.src);
          v.querySelectorAll('source').forEach(s => {
            if (s.src && !s.src.startsWith('blob:')) urls.add(s.src);
          });
        });
        document.querySelectorAll('a[href*=".mp4"], a[href*=".mov"], a[href*=".webm"]').forEach(a => {
          urls.add(a.href);
        });
        return [...urls];
      })()
    `);

    const http = require('http');
    const https = require('https');
    const downloaded = [];

    for (const url of videoUrls) {
      try {
        const ext = url.match(/\\.(mp4|mov|webm|m3u8)/i)?.[1] || 'mp4';
        const filename = `video_${Date.now()}_${downloaded.length}.${ext}`;
        const filePath = path.join(mediaDir, filename);

        const protocol = url.startsWith('https') ? https : http;
        await new Promise((resolve, reject) => {
          protocol.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              // Follow redirect
              const redirProto = res.headers.location.startsWith('https') ? https : http;
              redirProto.get(res.headers.location, (res2) => {
                const ws = fs.createWriteStream(filePath);
                res2.pipe(ws);
                ws.on('finish', () => { ws.close(); resolve(); });
              }).on('error', reject);
            } else {
              const ws = fs.createWriteStream(filePath);
              res.pipe(ws);
              ws.on('finish', () => { ws.close(); resolve(); });
            }
          }).on('error', reject);
        });

        downloaded.push({ url, path: filePath, filename });
      } catch (e) {
        // Skip failed downloads
      }
    }

    return { success: true, downloaded, count: downloaded.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ========== Screenshot Workflow: Flow Management ==========
const fs = require('fs');
const dataDir = path.join(__dirname, '..', 'data');
const flowsDir = path.join(dataDir, 'flows');
const screenshotsDir = path.join(dataDir, 'screenshots');
if (!fs.existsSync(flowsDir)) fs.mkdirSync(flowsDir, { recursive: true });
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

// Save a navigation flow
ipcMain.handle('flow:save', async (_event, { name, steps }) => {
  const flow = { name, steps, createdAt: new Date().toISOString() };
  const filePath = path.join(flowsDir, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(flow, null, 2), 'utf-8');
  return { success: true, path: filePath };
});

// List saved flows
ipcMain.handle('flow:list', async () => {
  const files = fs.readdirSync(flowsDir).filter(f => f.endsWith('.json'));
  const flows = files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(flowsDir, f), 'utf-8'));
    return { name: data.name, stepCount: data.steps?.length || 0, createdAt: data.createdAt };
  });
  return { success: true, flows };
});

// Load a flow
ipcMain.handle('flow:load', async (_event, name) => {
  const filePath = path.join(flowsDir, `${name}.json`);
  if (!fs.existsSync(filePath)) return { success: false, error: '流程不存在' };
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return { success: true, flow: data };
});

// Delete a flow
// 加载已保存的分析数据
ipcMain.handle('browser:loadAnalysis', async () => {
  const fs = require('fs');
  // 找最新的 auto_* 目录
  if (!fs.existsSync(screenshotsDir)) return { success: false, error: '无截图目录' };
  const dirs = fs.readdirSync(screenshotsDir).filter(d => d.startsWith('auto_')).sort().reverse();
  if (dirs.length === 0) return { success: false, error: '无已保存的采集数据' };
  const analysisPath = path.join(screenshotsDir, dirs[0], 'analysis.json');
  if (!fs.existsSync(analysisPath)) return { success: false, error: '未找到分析数据文件' };
  const data = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
  // 推送给前端
  sendToRenderer('dataeye:data', { section: '__auto_analysis__', data });
  return { success: true, dir: dirs[0], sections: Object.keys(data) };
});

ipcMain.handle('flow:delete', async (_event, name) => {
  const filePath = path.join(flowsDir, `${name}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return { success: true };
});

// Batch screenshot: follow a flow, screenshot each step
// DataEye 全自动采集：遍历所有板块 × 所有时间周期 × 滚动截图
ipcMain.handle('browser:autoCrawlScreenshots', async (_event, { sections, periods, scrollCount = 5, waitMs = 4000 }) => {
  if (!popupWindow) return { success: false, error: '浏览器未打开' };

  const fs = require('fs');
  const results = [];
  const ts = Date.now();
  const dir = path.join(screenshotsDir, `auto_${ts}`);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // 先确保在首页
  const currentUrl = popupWindow.webContents.getURL() || '';
  if (!currentUrl.includes('dataeye.com')) {
    try {
      await popupWindow.webContents.loadURL('https://oversea-v2.dataeye.com/index/home');
      await new Promise(r => setTimeout(r, 6000));
    } catch {}
  }

  // 检查登录
  const loginCheck = await popupWindow.webContents.executeJavaScript(`document.body.innerText.substring(0, 300)`);
  if (loginCheck.includes('登 录') || loginCheck.includes('请输入邮箱')) {
    return { success: false, error: '请先手动登录DataEye' };
  }

  const totalSteps = sections.length * periods.length;
  let stepNum = 0;

  // 板块名 → DataEye 侧边栏菜单文本（需要精确匹配）
  const SECTION_MENU_MAP = {
    '素材筛选': '素材筛选',
    'HOT': 'HOT',
    '可玩广告': '可玩广告',
    'W2A落地页': 'W2A落地页',
    '热门BGM榜': '热门BGM榜',
    '文案灵感': '文案灵感',
    '黄金3s台词': '黄金3s台词',
    '预约落地页': '预约落地页',
    '中国内地出海榜': '中国内地出海榜',
    '游戏买量总榜': '游戏买量总榜',
    '游戏预约榜': '游戏预约榜',
  };

  for (const section of sections) {
    const menuText = SECTION_MENU_MAP[section] || section;

    // 导航：先展开父菜单（异步），再点击子项
    // Phase 1: 展开包含目标子项的父菜单
    await popupWindow.webContents.executeJavaScript(`
      (function() {
        var target = '${menuText}';
        var parents = document.querySelectorAll('.ae20c876-menu-submenu-title, [class*="submenu-title"]');
        for (var p of parents) {
          var parentEl = p.closest('.ae20c876-menu-submenu, [class*="submenu"]');
          if (!parentEl) continue;
          var subItems = parentEl.querySelectorAll('.ae20c876-menu-item, [class*="menu-item"]');
          for (var sub of subItems) {
            if (sub.textContent.trim() === target && !sub.classList.contains('ae20c876-menu-submenu-title')) {
              if (!parentEl.classList.contains('ae20c876-menu-submenu-open')) {
                p.click();
              }
              return 'expand:' + target;
            }
          }
        }
        return 'no-parent:' + target;
      })()
    `);
    await new Promise(r => setTimeout(r, 1200));

    // Phase 2: 查找并点击子菜单项
    const navResult = await popupWindow.webContents.executeJavaScript(`
      (function() {
        var target = '${menuText}';

        // 策略1: 精确匹配 DataEye 菜单项
        var items = document.querySelectorAll('.ae20c876-menu-item, [class*="menu-item"]:not([class*="submenu"])');
        for (var item of items) {
          if (item.textContent.trim() === target && !item.classList.contains('ae20c876-menu-submenu-title')) {
            item.click();
            return 'clicked:' + target;
          }
        }

        // 策略2: 查找叶子元素（无子元素的精确匹配）
        var allEls = document.querySelectorAll('li, a, span, div');
        for (var el of allEls) {
          var t = el.textContent.trim();
          if (t === target && el.offsetHeight > 0 && el.offsetHeight < 50 && el.children.length === 0) {
            el.click();
            return 'clicked-leaf:' + target;
          }
        }

        // 策略3: 在侧边栏范围内查找
        var sidebar = document.querySelector('.ae20c876-layout-sider, [class*="sider"], aside');
        if (sidebar) {
          var sItems = sidebar.querySelectorAll('a, li, span, div');
          for (var s of sItems) {
            if (s.textContent.trim() === target && s.offsetHeight > 0 && s.offsetHeight < 50) {
              s.click();
              return 'clicked-sidebar:' + target;
            }
          }
        }

        return 'not-found:' + target;
      })()
    `);
    console.log(`导航 ${section}: ${navResult}`);
    if (navResult.startsWith('not-found')) {
      sendToRenderer('crawl:progress', { current: stepNum, total: totalSteps, message: `${section}: 菜单项未找到，跳过` });
      // 跳过该板块的所有周期
      for (const period of periods) { stepNum++; }
      continue;
    }

    await new Promise(r => setTimeout(r, waitMs));

    for (const period of periods) {
      stepNum++;
      sendToRenderer('crawl:progress', {
        current: stepNum, total: totalSteps,
        message: `${section} [${period}] ${stepNum}/${totalSteps}`,
      });

      // 点击时间周期按钮（多种策略）
      const periodClicked = await popupWindow.webContents.executeJavaScript(`
        (function() {
          var target = '${period}';

          // 策略1：Ant Design radio-button
          var radios = document.querySelectorAll('.ant-radio-button-wrapper, [class*="radio-button"]');
          for (var r of radios) {
            if (r.textContent.trim() === target) { r.click(); return 'radio:' + target; }
          }

          // 策略2：所有可见 span/div/button 包含目标文本
          var els = document.querySelectorAll('span, div, button, a, label, li');
          for (var el of els) {
            var t = el.textContent.trim();
            if (t === target && el.offsetHeight > 0 && el.offsetHeight < 60 && el.children.length <= 2) {
              el.click();
              return 'element:' + el.tagName + '.' + el.className.substring(0, 30);
            }
          }

          // 策略3：模糊匹配（包含目标文本）
          for (var el2 of els) {
            var t2 = el2.textContent.trim();
            if (t2.includes(target) && t2.length < target.length + 10 && el2.offsetHeight > 0) {
              el2.click();
              return 'fuzzy:' + t2.substring(0, 30);
            }
          }

          // 策略4：点击日期范围区域，展开下拉
          var dateArea = document.querySelector('[class*="date"], [class*="range"], [class*="period"], [class*="filter"]');
          if (dateArea && dateArea.offsetHeight > 0) {
            dateArea.click();
            // 等下拉展开后再试
            return 'clicked-date-area';
          }

          return 'not-found';
        })()
      `);
      console.log(`[${section}] 点击周期 "${period}": ${periodClicked}`);

      // 如果点击了日期区域展开下拉，等待后再次尝试点击目标周期
      if (periodClicked === 'clicked-date-area') {
        await new Promise(r => setTimeout(r, 1500));
        await popupWindow.webContents.executeJavaScript(`
          (function() {
            var target = '${period}';
            var els = document.querySelectorAll('span, div, button, a, label, li, [class*="dropdown"] *, [class*="popover"] *, [class*="overlay"] *');
            for (var el of els) {
              var t = el.textContent.trim();
              if (t === target && el.offsetHeight > 0) {
                el.click();
                return 'dropdown-clicked:' + t;
              }
            }
            return 'dropdown-not-found';
          })()
        `);
      }
      await new Promise(r => setTimeout(r, waitMs));

      // 向下滚动截图并拼接为一张长图（用浏览器 Canvas 拼接）
      const viewportH = popupWindow.getBounds().height;
      const viewportW = popupWindow.getBounds().width;

      // 先回到顶部
      await popupWindow.webContents.executeJavaScript('window.scrollTo(0, 0)');
      await new Promise(r => setTimeout(r, 500));

      // 获取页面实际高度
      const pageH = await popupWindow.webContents.executeJavaScript(`Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)`);
      const actualScrollCount = Math.min(scrollCount, Math.ceil(pageH / viewportH));

      // 逐屏截取为 base64
      const base64Images = [];
      for (let s = 0; s < actualScrollCount; s++) {
        const scrollY = s * viewportH;
        await popupWindow.webContents.executeJavaScript(`window.scrollTo(0, ${scrollY})`);
        await new Promise(r => setTimeout(r, 600));
        const img = await popupWindow.webContents.capturePage({ x: 0, y: 0, width: viewportW, height: viewportH });
        base64Images.push(img.toDataURL());
      }

      // 回到顶部
      await popupWindow.webContents.executeJavaScript('window.scrollTo(0, 0)');

      // 用浏览器 Canvas 拼接为一张长图
      const stitchedBase64 = await popupWindow.webContents.executeJavaScript(`
        (async function() {
          var imgs = ${JSON.stringify(base64Images)};
          var loadedImgs = await Promise.all(imgs.map(function(src) {
            return new Promise(function(resolve) {
              var img = new Image();
              img.onload = function() { resolve(img); };
              img.onerror = function() { resolve(null); };
              img.src = src;
            });
          }));
          loadedImgs = loadedImgs.filter(function(i) { return i !== null; });
          var totalH = loadedImgs.reduce(function(s, img) { return s + img.height; }, 0);
          var w = loadedImgs[0].width;
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = totalH;
          var ctx = canvas.getContext('2d');
          var y = 0;
          for (var i = 0; i < loadedImgs.length; i++) {
            ctx.drawImage(loadedImgs[i], 0, y);
            y += loadedImgs[i].height;
          }
          return canvas.toDataURL('image/png');
        })()
      `);

      // 保存拼接后的图片
      const fname = `${section}_${period}.png`;
      const fpath = path.join(dir, fname);
      const imgData = stitchedBase64.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(fpath, Buffer.from(imgData, 'base64'));

      results.push({
        section, period,
        screenshotPath: fpath, filename: fname,
        captureCount: actualScrollCount,
        timestamp: new Date().toISOString(),
      });

      sendToRenderer('crawl:progress', {
        current: stepNum, total: totalSteps,
        message: `${section} [${period}] 完成 (${actualScrollCount}屏→1张长图)`,
      });
    }
  }

  // 保存元数据
  const metaPath = path.join(dir, 'meta.json');
  fs.writeFileSync(metaPath, JSON.stringify({ results, createdAt: new Date().toISOString() }, null, 2));

  // ===== 自动分析：对每个板块×周期重新提取表格数据 =====
  sendToRenderer('crawl:progress', { current: totalSteps, total: totalSteps, message: '截图完成，开始自动分析数据...' });
  const analyzedData = {};

  for (const section of sections) {
    // 导航到板块（使用与截图阶段相同的可靠导航逻辑）
    await popupWindow.webContents.executeJavaScript(`
      (function() {
        var parents = document.querySelectorAll('.ae20c876-menu-submenu-title, [class*="submenu-title"]');
        for (var p of parents) {
          var parentEl = p.closest('.ae20c876-menu-submenu, [class*="submenu"]');
          if (!parentEl) continue;
          var subItems = parentEl.querySelectorAll('.ae20c876-menu-item, [class*="menu-item"]');
          for (var sub of subItems) {
            if (sub.textContent.trim() === '${section}' && !sub.classList.contains('ae20c876-menu-submenu-title')) {
              if (!parentEl.classList.contains('ae20c876-menu-submenu-open')) p.click();
              return;
            }
          }
        }
      })()
    `);
    await new Promise(r => setTimeout(r, 1200));
    await popupWindow.webContents.executeJavaScript(`
      (function() {
        var items = document.querySelectorAll('.ae20c876-menu-item, [class*="menu-item"]:not([class*="submenu"])');
        for (var item of items) {
          if (item.textContent.trim() === '${section}' && !item.classList.contains('ae20c876-menu-submenu-title')) {
            item.click(); return;
          }
        }
        // 叶子元素备用
        var allEls = document.querySelectorAll('li, a, span, div');
        for (var el of allEls) {
          if (el.textContent.trim() === '${section}' && el.offsetHeight > 0 && el.offsetHeight < 50 && el.children.length === 0) {
            el.click(); return;
          }
        }
      })()
    `);
    await new Promise(r => setTimeout(r, waitMs));

    for (const period of periods) {
      sendToRenderer('crawl:progress', { current: totalSteps, total: totalSteps, message: `分析: ${section} [${period}]...` });

      // 点击周期按钮
      await popupWindow.webContents.executeJavaScript(`
        (function() {
          var target = '${period}';
          var els = document.querySelectorAll('span, div, button, a, label, li');
          for (var el of els) {
            if (el.textContent.trim() === target && el.offsetHeight > 0 && el.offsetHeight < 60 && el.children.length <= 2) {
              el.click(); return;
            }
          }
        })()
      `);
      await new Promise(r => setTimeout(r, waitMs));

      // 提取当前页面数据
      const extracted = await popupWindow.webContents.executeJavaScript(`
        (function() {
          var rows = [];
          var seen = new Set();

          // 找所有包含 img 的数据卡片
          var allImgs = document.querySelectorAll('div img, a img');
          for (var img of allImgs) {
            if (!img.src || img.src.startsWith('data:') || img.naturalWidth < 20) continue;
            var container = img.parentElement;
            for (var i = 0; i < 5; i++) {
              if (!container) break;
              var texts = container.querySelectorAll('div, span, p, a');
              var directTexts = [];
              var addedTexts = new Set();
              for (var el of texts) {
                var t = (el.textContent || '').trim().replace(/\\s+/g, ' ');
                if (t.length > 0 && t.length < 150 && el.children.length < 3 && !addedTexts.has(t.substring(0, 30))) {
                  directTexts.push(t);
                  addedTexts.add(t.substring(0, 30));
                }
              }
              if (directTexts.length >= 3 && directTexts.length <= 20) {
                var rowKey = directTexts.map(function(t) { return t.substring(0, 30); }).join('|');
                if (!seen.has(rowKey)) {
                  seen.add(rowKey);
                  rows.push({ texts: directTexts, img: img.src.split('?')[0] });
                }
                break;
              }
              container = container.parentElement;
            }
          }

          // 如果没有图片行，尝试纯文本行
          if (rows.length === 0) {
            var divs = document.querySelectorAll('div');
            for (var div of divs) {
              if (div.offsetHeight < 25 || div.offsetHeight > 300) continue;
              if (div.children.length < 3 || div.children.length > 15) continue;
              var childTexts = [];
              for (var c of div.children) {
                var ct = (c.textContent || '').trim();
                if (ct.length > 0 && ct.length < 150) childTexts.push(ct);
              }
              if (childTexts.length >= 3 && childTexts.length <= 12) {
                var rk = childTexts.map(function(t) { return t.substring(0, 30); }).join('|');
                if (!seen.has(rk)) {
                  seen.add(rk);
                  rows.push({ texts: childTexts, img: '' });
                }
              }
            }
          }

          return { rowCount: rows.length, rows: rows.slice(0, 30) };
        })()
      `);

      if (!analyzedData[section]) analyzedData[section] = {};
      analyzedData[section][period] = {
        section, period,
        rows: extracted.rows,
        rowCount: extracted.rowCount,
        extractedAt: new Date().toISOString(),
      };
    }
  }

  // 保存分析结果
  const analysisPath = path.join(dir, 'analysis.json');
  fs.writeFileSync(analysisPath, JSON.stringify(analyzedData, null, 2));

  sendToRenderer('crawl:complete', {
    message: `自动采集完成: ${totalSteps} 组截图, 已分析 ${Object.keys(analyzedData).length} 个板块数据`,
  });

  // 通知前端更新数据
  sendToRenderer('dataeye:data', { section: '__auto_analysis__', data: analyzedData });

  return { success: true, results, totalScreenshots: results.reduce((s, r) => s + r.captureCount, 0), analyzedData, dir };
});

ipcMain.handle('browser:batchScreenshot', async (_event, { flowName, steps, waitMs = 5000, mode = 'navigate' }) => {
  if (!popupWindow) return { success: false, error: '浏览器未打开' };
  const results = [];
  const ts = Date.now();

  // 判断是否是 DataEye 站点（需要 SPA 内部导航）
  const currentUrl = popupWindow.webContents.getURL() || '';
  const isDataEye = currentUrl.includes('dataeye.com');

  // 如果是 DataEye，先确保在首页
  if (isDataEye) {
    try {
      await popupWindow.webContents.loadURL('https://oversea-v2.dataeye.com/index/home');
      await new Promise(r => setTimeout(r, 6000));
    } catch (e) {
      // 忽略，继续尝试
    }
  }

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    sendToRenderer('crawl:progress', {
      current: i + 1, total: steps.length,
      message: `截图 ${i + 1}/${steps.length}: ${step.name || step.url.substring(0, 40)}`,
    });

    try {
      if (mode === 'replay' && step.clickSelector) {
        // 回放模式：点击录制时记录的选择器
        await popupWindow.webContents.executeJavaScript(`
          (function() {
            var el = document.querySelector('${step.clickSelector.replace(/'/g, "\\'")}');
            if (el) { el.scrollIntoView({block:'center'}); el.click(); return true; }
            // 备用：按文本查找
            var all = document.querySelectorAll('span, div, button, a, li');
            for (var i = 0; i < all.length; i++) {
              if (all[i].textContent.trim() === '${(step.clickText || '').replace(/'/g, "\\'")}' && all[i].offsetHeight > 0) {
                all[i].scrollIntoView({block:'center'});
                all[i].click();
                return true;
              }
            }
            return false;
          })()
        `);
        await new Promise(r => setTimeout(r, waitMs));
      } else if (isDataEye) {
        // SPA 导航：通过点击侧边栏菜单
        const menuText = step.menuText || step.name || '';
        const clicked = await popupWindow.webContents.executeJavaScript(`
          (function() {
            // 先展开父菜单（如果目标是子菜单项）
            const parents = document.querySelectorAll('.ae20c876-menu-submenu-title, [class*="submenu-title"]');
            for (const p of parents) {
              // 检查这个父菜单下是否有目标子项
              const parentEl = p.closest('.ae20c876-menu-submenu, [class*="submenu"]');
              if (parentEl) {
                const subItems = parentEl.querySelectorAll('[class*="menu-item"]');
                for (const sub of subItems) {
                  if (sub.textContent.trim() === '${menuText}' && !sub.classList.contains('ae20c876-menu-submenu-title')) {
                    // 需要先展开父菜单
                    if (!parentEl.classList.contains('ae20c876-menu-submenu-open')) {
                      p.click();
                    }
                    break;
                  }
                }
              }
            }

            // 查找并点击目标菜单项
            const items = document.querySelectorAll('.ae20c876-menu-item, [class*="menu-item"]:not([class*="submenu"])');
            for (const item of items) {
              if (item.textContent.trim() === '${menuText}') {
                item.click();
                return true;
              }
            }
            // 备用：全量搜索
            const allEls = document.querySelectorAll('li, a, span, div');
            for (const el of allEls) {
              const t = el.textContent.trim();
              if (t === '${menuText}' && el.offsetHeight > 0 && el.offsetHeight < 50 && el.children.length === 0) {
                el.click();
                return true;
              }
            }
            return false;
          })()
        `);

        if (!clicked) {
          results.push({ stepIndex: i, name: step.name, url: step.url, error: '未找到菜单项: ' + menuText });
          continue;
        }

        await new Promise(r => setTimeout(r, waitMs));

        // 如果有 scrollY，滚动到指定位置
        if (step.scrollY) {
          await popupWindow.webContents.executeJavaScript(`window.scrollTo(0, ${step.scrollY})`);
          await new Promise(r => setTimeout(r, 1000));
        }
      } else {
        // 非 DataEye：直接 loadURL
        await popupWindow.webContents.loadURL(step.url);
        await new Promise(r => setTimeout(r, waitMs));
      }

      // Scroll-capture: get full page dimensions
      const pageInfo = await popupWindow.webContents.executeJavaScript(`({
        scrollHeight: document.body.scrollHeight,
        scrollWidth: document.body.scrollWidth,
        title: document.title,
      })`);

      const viewportHeight = popupWindow.getBounds().height;
      const pageHeight = Math.min(pageInfo.scrollHeight, 20000);
      const captures = [];

      // Scroll to top first
      await popupWindow.webContents.executeJavaScript('window.scrollTo(0, 0)');
      await new Promise(r => setTimeout(r, 500));

      // Capture each viewport section while scrolling
      for (let y = 0; y < pageHeight; y += viewportHeight) {
        await popupWindow.webContents.executeJavaScript(`window.scrollTo(0, ${y})`);
        await new Promise(r => setTimeout(r, 600));
        const image = await popupWindow.webContents.capturePage();
        const partNum = Math.floor(y / viewportHeight);
        const partPath = path.join(screenshotsDir, `batch_${ts}_step${i}_p${partNum}.png`);
        fs.writeFileSync(partPath, image.toPNG());
        captures.push({ path: partPath, index: partNum, scrollY: y });
      }

      // Scroll back to top
      await popupWindow.webContents.executeJavaScript('window.scrollTo(0, 0)');

      // Get page text for context
      const pageText = await popupWindow.webContents.executeJavaScript(
        `document.body?.innerText?.substring(0, 2000) || ''`
      );

      results.push({
        stepIndex: i, name: step.name, url: step.url,
        captures, captureCount: captures.length,
        screenshotPath: captures[0]?.path, filename: captures[0]?.path ? path.basename(captures[0].path) : '',
        pageText: pageText.substring(0, 500),
        scrollHeight: pageHeight, viewportHeight,
        timestamp: new Date().toISOString(),
      });

      // Send progress update
      sendToRenderer('crawl:progress', {
        current: i + 1, total: steps.length,
        message: `截图 ${i + 1}/${steps.length}: ${step.name} (${captures.length}张)`,
      });
    } catch (err) {
      results.push({ stepIndex: i, name: step.name, url: step.url, error: err.message });
    }
  }

  // Save batch metadata
  const metaPath = path.join(dataDir, `batch_${ts}.json`);
  fs.writeFileSync(metaPath, JSON.stringify({ flowName, results, createdAt: new Date().toISOString() }, null, 2), 'utf-8');

  return { success: true, results, count: results.length, metaPath, dir: screenshotsDir };
});

// List saved screenshots
ipcMain.handle('screenshot:list', async () => {
  const files = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));
  const items = files.map(f => {
    const stat = fs.statSync(path.join(screenshotsDir, f));
    return { filename: f, path: path.join(screenshotsDir, f), size: stat.size, mtime: stat.mtime };
  }).sort((a, b) => b.mtime - a.mtime);
  return { success: true, screenshots: items };
});

// Open screenshot in system viewer
ipcMain.handle('screenshot:open', async (_event, filename) => {
  const filePath = path.join(screenshotsDir, filename);
  if (fs.existsSync(filePath)) {
    require('electron').shell.openPath(filePath);
    return { success: true };
  }
  return { success: false, error: '文件不存在' };
});

// 点击录制
let recordedClicks = [];

ipcMain.handle('browser:startRecording', async () => {
  if (!popupWindow) return { success: false, error: '浏览器未打开' };
  recordedClicks = [];

  // 注入点击监听器
  await popupWindow.webContents.executeJavaScript(`
    (function() {
      window.__recordingClicks = true;
      window.__recordedClicks = [];
      window.__clickHandler = function(e) {
        if (!window.__recordingClicks) return;
        // 生成 CSS 选择器路径
        function getSelector(el) {
          if (el.id) return '#' + el.id;
          if (el === document.body) return 'body';
          var parts = [];
          var parent = el;
          while (parent && parent !== document.body && parts.length < 6) {
            var tag = parent.tagName.toLowerCase();
            if (parent.id) {
              parts.unshift(tag + '#' + parent.id);
              break;
            }
            var cls = parent.className && typeof parent.className === 'string'
              ? parent.className.split(' ').filter(c => c && !c.includes('css-')).slice(0, 2).map(c => '.' + c).join('')
              : '';
            var siblings = parent.parentElement ? Array.from(parent.parentElement.children).filter(c => c.tagName === parent.tagName) : [];
            var nth = siblings.length > 1 ? ':nth-child(' + (siblings.indexOf(parent) + 1) + ')' : '';
            parts.unshift(tag + cls + nth);
            parent = parent.parentElement;
          }
          return parts.join(' > ');
        }
        var text = (e.target.textContent || '').trim().substring(0, 50);
        window.__recordedClicks.push({
          selector: getSelector(e.target),
          text: text,
          tag: e.target.tagName,
          timestamp: Date.now()
        });
      };
      document.addEventListener('click', window.__clickHandler, true);
      return 'recording started';
    })()
  `);

  return { success: true };
});

ipcMain.handle('browser:stopRecording', async () => {
  if (!popupWindow) return { success: false, clicks: [] };

  const clicks = await popupWindow.webContents.executeJavaScript(`
    (function() {
      window.__recordingClicks = false;
      document.removeEventListener('click', window.__clickHandler, true);
      return window.__recordedClicks || [];
    })()
  `);

  recordedClicks = clicks;
  return { success: true, clicks };
});

ipcMain.handle('browser:getRecordedClicks', async () => {
  return { success: true, clicks: recordedClicks };
});

ipcMain.handle('browser:getPageInfo', async () => {
  if (!popupWindow) return null;
  return {
    url: popupWindow.webContents.getURL(),
    title: popupWindow.webContents.getTitle(),
  };
});

ipcMain.handle('browser:goBack', async () => {
  if (popupWindow?.webContents?.canGoBack()) popupWindow.webContents.goBack();
});

ipcMain.handle('browser:goForward', async () => {
  if (popupWindow?.webContents?.canGoForward()) popupWindow.webContents.goForward();
});

ipcMain.handle('browser:reload', async () => {
  if (popupWindow) popupWindow.webContents.reload();
});

ipcMain.handle('browser:close', async () => {
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.close();
  }
  popupWindow = null;
});

ipcMain.handle('browser:show', async (_event, url) => {
  const pw = ensurePopupWindow();
  if (url && typeof url === 'string') {
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    await pw.loadURL(url);
  }
  pw.show();
  pw.focus();
});

ipcMain.handle('browser:hide', async () => {
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.minimize();
  }
});

// ========== Full-Site Crawl Engine ==========
ipcMain.handle('crawl:start', async (_event, { startUrl, maxPages = 20, sameDomain = true }) => {
  crawlAbort = false;
  const bv = ensurePopupWindow();
  if (!startUrl.startsWith('http')) startUrl = 'https://' + startUrl;
  const startDomain = new URL(startUrl).hostname;

  const visited = new Set();
  const queue = [{ url: startUrl, depth: 0 }];
  let allItems = [];
  let pageCount = 0;

  sendToRenderer('crawl:progress', { current: 0, total: maxPages, message: '开始爬取...' });

  while (queue.length > 0 && pageCount < maxPages && !crawlAbort) {
    const { url, depth } = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      sendToRenderer('crawl:progress', {
        current: pageCount + 1, total: maxPages,
        message: `正在爬取: ${url.substring(0, 60)}...`,
      });

      await bv.webContents.loadURL(url);
      // Wait for page to settle (DataEye SPA needs longer)
      const isDataEye = url.includes('dataeye.com');
      await new Promise(r => setTimeout(r, isDataEye ? 4000 : 2000));

      // Auto-select extraction script based on URL
      const extractScript = isDataEye ? DATAEYE_EXTRACT_SCRIPT : EXTRACT_SCRIPT;
      let result = await bv.webContents.executeJavaScript(extractScript);

      // Fallback: if no items found, take screenshot for later analysis
      if (result.items.length === 0) {
        sendToRenderer('crawl:progress', {
          current: pageCount + 1, total: maxPages,
          message: `页面无结构化数据，截图保存: ${url.substring(0, 50)}...`,
        });
        try {
          const ssDir = path.join(__dirname, '..', 'data', 'screenshots');
          const fs = require('fs');
          if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });
          const image = await bv.webContents.capturePage();
          const ssPath = path.join(ssDir, `crawl_${pageCount}_${Date.now()}.png`);
          fs.writeFileSync(ssPath, image.toPNG());
          // Record as screenshot item for later analysis
          result.items = [{
            type: 'screenshot', creativeType: 'screenshot', creativeUrl: ssPath,
            source: isDataEye ? 'DataEye' : 'unknown', pageUrl: url,
            adText: result.fullText?.substring(0, 500) || '',
            crawledAt: new Date().toISOString(),
            rawData: { screenshotPath: ssPath, pageText: result.fullText?.substring(0, 2000) },
          }];
        } catch (e) { /* screenshot failed, skip */ }
      }

      pageCount++;

      // Add source URL to each item
      const items = result.items.map((item, i) => ({
        ...item,
        id: `crawl-${pageCount}-${i}`,
        pageUrl: url,
      }));
      allItems = allItems.concat(items);

      sendToRenderer('crawl:data', { pageUrl: url, items, links: result.links, fullText: result.fullText });

      // Queue follow links (same domain, depth < 3)
      if (depth < 3) {
        for (const link of result.links) {
          try {
            const linkDomain = new URL(link.url).hostname;
            if (sameDomain && linkDomain !== startDomain) continue;
            if (!visited.has(link.url) && queue.length < 100) {
              queue.push({ url: link.url, depth: depth + 1 });
            }
          } catch (e) { /* invalid URL */ }
        }
      }
    } catch (err) {
      sendToRenderer('crawl:error', { url, error: err.message });
    }
  }

  sendToRenderer('crawl:complete', {
    totalPages: pageCount,
    totalItems: allItems.length,
    message: crawlAbort ? '爬取已停止' : `爬取完成: ${pageCount} 页, ${allItems.length} 条数据`,
  });

  return { success: true, totalPages: pageCount, totalItems: allItems.length, items: allItems };
});

// ========== DataEye 专属分板块爬虫 ==========
const DATAEYE_SECTIONS = {
  '广告创意': '/creative/material',
  '素材筛选': '/creative/material',
  'HOT': '/creative/material',
  '可玩广告': '/creative/playable',
  'W2A落地页': '/creative/w2a',
  '热门BGM榜': '/creative/bgm',
  '文案灵感': '/creative/copywriter',
  '黄金3s台词': '/creative/golden3s',
  '预约落地页': '/creative/target-page',
  '中国内地出海榜': '/rank/overseas',
  '游戏买量总榜': '/rank/transactions',
  '游戏预约榜': '/rank/appointment',
};

const DATAEYE_BASE = 'https://oversea-v2.dataeye.com';

// DataEye 分板块数据提取脚本（div 布局 + 分页）
const DATAEYE_SECTION_EXTRACT = `
(function() {
  const rows = [];
  const seen = new Set();

  // DataEye 使用 div 布局渲染数据，不是 HTML table
  // 策略：找到包含 img + 多个文本节点的数据卡片/行

  // 1. 查找所有包含 img 的 div 容器
  const allImgs = document.querySelectorAll('div img, a img');

  for (const img of allImgs) {
    if (!img.src || img.src.startsWith('data:') || img.naturalWidth < 20) continue;

    // 向上找到包含这个 img 的数据卡片容器（通常 2-4 层）
    let container = img.parentElement;
    for (let i = 0; i < 5; i++) {
      if (!container) break;
      // 检查这个容器是否有多个文本子元素（像表格行一样的结构）
      const texts = container.querySelectorAll('div, span, p, a');
      const directTexts = Array.from(texts).filter(el => {
        const t = el.textContent.trim();
        return t.length > 0 && t.length < 200 && el.children.length < 3;
      });
      // 如果找到有足够文本节点的容器，认为是数据行
      if (directTexts.length >= 3 && directTexts.length <= 20) {
        const cellData = [];
        let rowKey = '';

        // 提取 img
        const imgSrc = img.src.split('?')[0];
        cellData.push({ text: '', img: imgSrc, href: '', header: '素材' });
        rowKey += 'img|';

        // 提取所有非空文本节点
        const addedTexts = new Set();
        for (const el of directTexts) {
          const t = el.textContent.trim().replace(/\\s+/g, ' ');
          if (t.length === 0 || t.length > 150) continue;
          // 去重：跳过子元素已包含的文本
          const shortKey = t.substring(0, 30);
          if (addedTexts.has(shortKey)) continue;
          addedTexts.add(shortKey);

          const link = el.closest('a') || (el.tagName === 'A' ? el : el.querySelector('a'));
          const href = link ? link.href : '';
          cellData.push({ text: t, img: '', href, header: '' });
          rowKey += shortKey + '|';
        }

        if (cellData.length >= 3 && !seen.has(rowKey)) {
          seen.add(rowKey);
          rows.push(cellData);
        }
        break;
      }
      container = container.parentElement;
    }
  }

  // 2. 备用方案：查找列表行（list item）模式
  if (rows.length === 0) {
    // 查找可能的行容器：有 flex/row 布局特征的 div
    const candidates = document.querySelectorAll('[class*="item"], [class*="row"], [class*="card"]');
    for (const el of candidates) {
      if (el.offsetHeight < 30 || el.offsetHeight > 400) continue;
      const imgs = el.querySelectorAll('img');
      if (imgs.length === 0) continue;

      const img = imgs[0];
      if (!img.src || img.src.startsWith('data:')) continue;

      const texts = [];
      el.querySelectorAll('*').forEach(child => {
        if (child.children.length === 0) {
          const t = child.textContent.trim();
          if (t.length > 0 && t.length < 200) texts.push(t);
        }
      });
      if (texts.length < 2) continue;

      const cellData = [{ text: '', img: img.src.split('?')[0], href: '', header: '素材' }];
      let rowKey = 'img|';
      for (const t of texts) {
        cellData.push({ text: t, img: '', href: '', header: '' });
        rowKey += t.substring(0, 30) + '|';
      }
      if (!seen.has(rowKey)) {
        seen.add(rowKey);
        rows.push(cellData);
      }
    }
  }

  // 3. 再备用：纯文本提取模式（适用于无图片的列表页）
  if (rows.length === 0) {
    const mainContent = document.querySelector('main, [class*="content"], [class*="container"]');
    const target = mainContent || document.body;
    const divs = target.querySelectorAll('div');
    for (const div of divs) {
      if (div.offsetHeight < 25 || div.offsetHeight > 300) continue;
      if (div.children.length < 3 || div.children.length > 15) continue;
      const childTexts = Array.from(div.children).map(c => c.textContent.trim()).filter(t => t.length > 0 && t.length < 150);
      if (childTexts.length >= 3 && childTexts.length <= 12) {
        let rowKey = childTexts.map(t => t.substring(0, 30)).join('|');
        if (!seen.has(rowKey)) {
          seen.add(rowKey);
          rows.push(childTexts.map(t => ({ text: t, img: '', href: '', header: '' })));
        }
      }
    }
  }

  // 分页检测
  const nextBtn = document.querySelector('.ant-pagination-next:not(.ant-pagination-disabled)');
  const hasNext = !!nextBtn;
  const pageInfo = document.querySelector('.ant-pagination-total-text');
  const totalText = pageInfo ? pageInfo.textContent.trim() : '';
  const activePage = document.querySelector('.ant-pagination-item-active');
  const currentPage = activePage ? parseInt(activePage.textContent) : 1;

  // 调试
  const debugInfo = {
    rowsFound: rows.length,
    bodyTextSample: document.body.innerText.substring(0, 500),
    imgCount: document.querySelectorAll('img').length,
    anchorCount: document.querySelectorAll('a').length,
  };

  return { rows, headers: [], hasNext, currentPage, totalText, debug: debugInfo };
})()
`;

// 时间周期按钮文本映射
const PERIOD_MAP = {
  'today': '今天',
  'yesterday': '昨天',
  '7d': '近7天',
  '30d': '近30天',
  'all': '全周期',
};

let dataeyeAbort = false;

ipcMain.handle('dataeye:crawl', async (_event, { sections, period = '30d', maxPages = 5 }) => {
  dataeyeAbort = false;
  const bv = ensurePopupWindow();
  const allData = {};
  const seen = new Set(); // 全局去重
  const totalSections = sections.length;
  let currentSection = 0;

  sendToRenderer('dataeye:progress', { current: 0, total: totalSections, section: '', message: '开始DataEye数据采集...' });

  // ===== 登录预处理：只在需要时登录 =====
  sendToRenderer('dataeye:progress', { current: 0, total: totalSections, section: '', message: '检查DataEye登录状态...' });

  // 先随便访问一个页面，看是否已登录
  try {
    const firstUrl = DATAEYE_BASE + DATAEYE_SECTIONS[sections[0]];
    await bv.webContents.loadURL(firstUrl || DATAEYE_BASE);
    await new Promise(r => setTimeout(r, 6000));

    const loginCheck = await bv.webContents.executeJavaScript(`({
      url: location.href,
      text: document.body.innerText.substring(0, 500)
    })`);

    const needLogin = loginCheck.text.includes('登 录') || loginCheck.text.includes('请输入邮箱') || loginCheck.url.includes('/login');

    if (needLogin) {
      sendToRenderer('dataeye:progress', { current: 0, total: totalSections, section: '', message: '需要登录，自动登录DataEye中...' });
      await bv.webContents.loadURL('https://oversea-v2.dataeye.com/index/login');
      await new Promise(r => setTimeout(r, 5000));

      // 填充并点击登录
      const clicked = await bv.webContents.executeJavaScript(`
        (function() {
          const cb = document.getElementById('isAgree');
          if (cb && !cb.checked) cb.click();
          const btns = document.querySelectorAll('button, .ant-btn, [type="submit"]');
          for (const btn of btns) {
            const txt = btn.textContent.trim();
            if (txt.includes('登') || txt.includes('Login') || txt.includes('Sign')) {
              btn.click();
              return true;
            }
          }
          return false;
        })()
      `);

      if (clicked) {
        await new Promise(r => setTimeout(r, 8000));
        sendToRenderer('dataeye:progress', { current: 0, total: totalSections, section: '', message: '登录完成，开始采集...' });
      } else {
        sendToRenderer('dataeye:progress', { current: 0, total: totalSections, section: '', message: '未找到登录按钮，尝试继续...' });
      }
    } else {
      sendToRenderer('dataeye:progress', { current: 0, total: totalSections, section: '', message: '已登录，开始采集...' });
    }
  } catch (loginErr) {
    sendToRenderer('dataeye:progress', { current: 0, total: totalSections, section: '', message: `登录检查异常，继续尝试...` });
  }

  for (const sectionName of sections) {
    if (dataeyeAbort) break;

    const urlPath = DATAEYE_SECTIONS[sectionName];
    if (!urlPath) {
      sendToRenderer('dataeye:progress', { current: ++currentSection, total: totalSections, section: sectionName, message: `跳过未知板块: ${sectionName}` });
      continue;
    }

    sendToRenderer('dataeye:progress', { current: currentSection, total: totalSections, section: sectionName, message: `正在采集: ${sectionName}...` });

    try {
      // DataEye 是 SPA，通过点击侧边栏导航而非 loadURL
      const navigated = await bv.webContents.executeJavaScript(`
        (function() {
          // 在侧边栏菜单中查找匹配的菜单项并点击
          const menuItems = document.querySelectorAll('.ae20c876-menu-item, .ae20c876-menu-submenu-title, [class*="menu"] a, [class*="menu"] li, [class*="sider"] a');
          for (const item of menuItems) {
            const text = item.textContent.trim();
            if (text === '${sectionName}') {
              item.click();
              return 'clicked: ' + text;
            }
          }
          // 备用：查找所有可点击元素
          const allEls = document.querySelectorAll('a, span, div, li');
          for (const el of allEls) {
            if (el.textContent.trim() === '${sectionName}' && el.offsetHeight > 0 && el.offsetHeight < 50) {
              el.click();
              return 'clicked-alt: ' + el.tagName + '.' + el.className.substring(0, 30);
            }
          }
          return 'not-found';
        })()
      `);
      console.log(`[${sectionName}] 导航结果: ${navigated}`);

      if (navigated === 'not-found') {
        sendToRenderer('dataeye:progress', { current: currentSection, total: totalSections, section: sectionName, message: `${sectionName}: 未找到侧边栏菜单项` });
        continue;
      }

      await new Promise(r => setTimeout(r, 8000)); // SPA 等待渲染

      // 再次检查是否需要登录（防止 session 过期）
      const pageInfo = await bv.webContents.executeJavaScript(`({
        url: location.href,
        text: document.body.innerText.substring(0, 500)
      })`);
      if (pageInfo.text.includes('登 录') || pageInfo.text.includes('请输入邮箱') || pageInfo.url.includes('/login')) {
        sendToRenderer('dataeye:error', { section: sectionName, error: '登录已过期，请在浏览器中重新登录DataEye后重试' });
        continue;
      }

      // 点击时间周期按钮
      const periodText = PERIOD_MAP[period] || '近30天';
      await bv.webContents.executeJavaScript(`
        (function() {
          // 查找并点击时间周期按钮
          const btns = document.querySelectorAll('.ant-radio-button-wrapper, .ant-btn, [class*="period"], [class*="date"], [class*="time"]');
          for (const btn of btns) {
            if (btn.textContent.trim() === '${periodText}') {
              btn.click();
              return true;
            }
          }
          // 备用：查找包含周期文本的可点击元素
          const allEls = document.querySelectorAll('span, div, button, a');
          for (const el of allEls) {
            if (el.textContent.trim() === '${periodText}' && el.offsetHeight > 0) {
              el.click();
              return true;
            }
          }
          return false;
        })()
      `);
      await new Promise(r => setTimeout(r, 3000)); // 等待数据刷新

      // 逐页提取表格数据
      const sectionRows = [];
      let pageNum = 0;

      while (pageNum < maxPages && !dataeyeAbort) {
        const extractResult = await bv.webContents.executeJavaScript(DATAEYE_SECTION_EXTRACT);

        if (extractResult.rows.length === 0 && pageNum === 0) {
          const dbg = extractResult.debug || {};
          console.log(`[${sectionName}] 未找到数据. Debug:`, JSON.stringify(dbg, null, 2));
          // 截图保存以便调试
          try {
            const ssPath = path.join(__dirname, '..', 'data', `debug_${sectionName.replace(/[\/\\?*:|"<>]/g, '_')}_${Date.now()}.png`);
            const fs = require('fs');
            const dataDir = path.join(__dirname, '..', 'data');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            const ss = await bv.webContents.capturePage();
            fs.writeFileSync(ssPath, ss.toPNG());
            console.log(`[${sectionName}] 截图: ${ssPath}`);
          } catch (ssErr) {}
          sendToRenderer('dataeye:progress', { current: currentSection, total: totalSections, section: sectionName, message: `${sectionName}: 未找到数据 (img:${dbg.imgCount} 样本:"${(dbg.bodyTextSample||'').substring(0,60)}")` });
          break;
        }

        // 去重并添加
        for (const row of extractResult.rows) {
          const rowKey = sectionName + ':' + row.map(c => c.text.substring(0, 40)).join('|');
          if (!seen.has(rowKey)) {
            seen.add(rowKey);
            sectionRows.push({
              cells: row,
              section: sectionName,
              page: pageNum + 1,
            });
          }
        }

        sendToRenderer('dataeye:progress', {
          current: currentSection,
          total: totalSections,
          section: sectionName,
          message: `${sectionName}: 第${pageNum + 1}页已采集 ${extractResult.rows.length} 条 (共${sectionRows.length}条)`,
        });

        // 翻到下一页
        if (!extractResult.hasNext) break;
        await bv.webContents.executeJavaScript(`
          (function() {
            const nextBtn = document.querySelector('.ant-pagination-next:not(.ant-pagination-disabled)');
            if (nextBtn) { nextBtn.click(); return true; }
            return false;
          })()
        `);
        await new Promise(r => setTimeout(r, 3000));
        pageNum++;
      }

      allData[sectionName] = {
        url,
        period: periodText,
        totalRows: sectionRows.length,
        rows: sectionRows,
        headers: sectionRows.length > 0 ? sectionRows[0].cells.map(c => c.header) : [],
      };

      sendToRenderer('dataeye:data', {
        section: sectionName,
        data: allData[sectionName],
      });

    } catch (err) {
      sendToRenderer('dataeye:error', { section: sectionName, error: err.message });
    }

    currentSection++;
  }

  // 保存结果到文件
  const fs = require('fs');
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const outPath = path.join(dataDir, `dataeye_crawl_${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(allData, null, 2));

  sendToRenderer('dataeye:complete', {
    sections: Object.keys(allData).length,
    totalRows: Object.values(allData).reduce((s, d) => s + d.totalRows, 0),
    message: dataeyeAbort ? '采集已停止' : `采集完成: ${Object.keys(allData).length} 个板块, ${Object.values(allData).reduce((s, d) => s + d.totalRows, 0)} 条数据`,
    savedTo: outPath,
  });

  return { success: true, data: allData, savedTo: outPath };
});

ipcMain.handle('dataeye:stop', async () => {
  dataeyeAbort = true;
  return { success: true };
});

ipcMain.handle('crawl:stop', async () => {
  crawlAbort = true;
  return { success: true };
});

// App lifecycle
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
