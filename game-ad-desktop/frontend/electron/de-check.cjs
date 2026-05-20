const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const ssDir = path.join(__dirname, '..', 'data', 'screenshots');

app.whenReady().then(async () => {
  // Create a small window that just navigates and screenshots
  const win = new BrowserWindow({
    width: 1400, height: 900,
    webPreferences: { contextIsolation: false },
  });

  await win.loadURL('https://adxray.dataeye.com');
  await new Promise(r => setTimeout(r, 6000));

  const url = win.webContents.getURL();
  const title = win.getTitle();
  console.log('URL:', url);
  console.log('Title:', title);

  const img = win.webContents.capturePage();
  const buf = (await img).toPNG();
  const p = path.join(ssDir, 'de_current_state.png');
  fs.writeFileSync(p, buf);
  console.log('Screenshot saved:', p);

  // Get page content
  const text = await win.webContents.executeJavaScript(
    `document.body?.innerText?.substring(0, 1000) || 'empty'`
  );
  console.log('Page text:', text.substring(0, 500));

  // Check if logged in
  const isLoggedIn = url.includes('/home') && !url.includes('/index/home');
  console.log('Logged in:', isLoggedIn);

  if (isLoggedIn) {
    console.log('SUCCESS - We are logged in!');
    // Navigate to product pages to get data
    const navResult = await win.webContents.executeJavaScript(`
      (function() {
        const links = [];
        document.querySelectorAll('a[href]').forEach(a => {
          const href = a.href;
          if (href && href.includes('dataeye.com') && !href.includes('logout')) {
            links.push({ url: href, text: a.textContent?.trim()?.substring(0, 40) });
          }
        });
        return { url: location.href, links: links.slice(0, 30) };
      })()
    `);
    console.log('Navigation links:', JSON.stringify(navResult.links, null, 2));
  }

  app.quit();
});
