const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const enrichedPath = path.join(__dirname, '..', 'data', 'crawledItems_enriched.json');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 400, height: 300,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
    },
  });

  win.loadURL('http://localhost:5173');

  win.webContents.on('did-finish-load', () => {
    setTimeout(async () => {
      try {
        const enriched = fs.readFileSync(enrichedPath, 'utf-8');
        const items = JSON.parse(enriched);

        await win.webContents.executeJavaScript(`
          localStorage.setItem('browser_crawledItems', ${JSON.stringify(JSON.stringify(items))});
          'injected ' + JSON.parse(localStorage.getItem('browser_crawledItems')).length + ' items'
        `);

        console.log(`Injected ${items.length} enriched items into localStorage`);
        console.log('Refresh the app to see updated data');
        app.quit();
      } catch (err) {
        console.error('Error:', err.message);
        app.quit();
      }
    }, 3000);
  });
});
