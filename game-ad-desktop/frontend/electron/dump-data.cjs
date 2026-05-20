const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let win;

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 400, height: 300,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
    },
  });

  win.loadURL('http://localhost:5173');

  // Wait for page to load, then extract localStorage
  win.webContents.on('did-finish-load', () => {
    setTimeout(async () => {
      try {
        const data = await win.webContents.executeJavaScript(`
          JSON.stringify({
            crawledItems: localStorage.getItem('browser_crawledItems'),
            rankings: localStorage.getItem('browser_rankings'),
            gameAnalyses: localStorage.getItem('browser_gameAnalyses'),
            history: localStorage.getItem('browser_history'),
            quickLinks: localStorage.getItem('browser_quicklinks'),
          })
        `);

        const parsed = JSON.parse(data);
        const outputDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        for (const [key, value] of Object.entries(parsed)) {
          if (value) {
            const filePath = path.join(outputDir, `${key}.json`);
            fs.writeFileSync(filePath, value, 'utf-8');
            const items = JSON.parse(value);
            console.log(`${key}: ${Array.isArray(items) ? items.length : 'N/A'} items`);
          } else {
            console.log(`${key}: null`);
          }
        }

        console.log('\nData exported to:', outputDir);
        app.quit();
      } catch (err) {
        console.error('Error:', err.message);
        app.quit();
      }
    }, 3000);
  });
});
