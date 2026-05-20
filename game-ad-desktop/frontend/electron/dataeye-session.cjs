const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const fs = require('fs');

const ssDir = path.join(__dirname, '..', 'data', 'screenshots');
if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });

// Use a persistent user data dir for session cookies
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

app.whenReady().then(async () => {
  win = new BrowserWindow({
    width: 1400, height: 900,
    webPreferences: { contextIsolation: false },
  });

  console.log('Opening DataEye (persistent session)...');
  await win.loadURL('https://adxray.dataeye.com');
  await sleep(5000);

  const url = win.webContents.getURL();
  console.log('Current URL:', url);
  console.log('Title:', win.getTitle());

  await ss('de_session_01');

  // Check if already logged in
  const bodyText = await win.webContents.executeJavaScript(
    `document.body?.innerText?.substring(0, 300) || ''`
  );
  console.log('Page text:', bodyText.substring(0, 200));

  const isLoginPage = bodyText.includes('登 录') || bodyText.includes('登录');
  console.log('Is login page:', isLoginPage);

  if (isLoginPage) {
    console.log('\n=== 需要登录 ===');
    console.log('请在弹出的 Electron 窗口中:');
    console.log('1. 输入账号: ADX@ewan.cn');
    console.log('2. 输入密码: Eworld@123456');
    console.log('3. 输入验证码');
    console.log('4. 勾选协议并点击登录');
    console.log('\n登录成功后，在此终端按回车键继续...');

    // Wait for user to manually log in
    await new Promise((resolve) => {
      process.stdin.resume();
      process.stdin.on('data', () => resolve());
    });

    console.log('继续执行...');
    await sleep(2000);

    const newUrl = win.webContents.getURL();
    console.log('After login URL:', newUrl);
    await ss('de_session_02_after_login');
  }

  // Now we should be logged in - explore the dashboard
  const finalUrl = win.webContents.getURL();
  console.log('\nFinal URL:', finalUrl);

  // Get all navigation links
  const navData = await win.webContents.executeJavaScript(`
    (function() {
      const links = [];
      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.href;
        if (href && href.includes('dataeye.com') && !href.includes('logout')) {
          links.push({ url: href, text: a.textContent?.trim()?.substring(0, 50) });
        }
      });

      // Get sidebar menu items
      const menuItems = [];
      document.querySelectorAll('.ant-menu-item, .ant-menu-submenu-title, [class*="menu"] a, [class*="nav"] a').forEach(el => {
        const text = el.textContent?.trim();
        const href = el.getAttribute('href') || el.closest('a')?.href;
        if (text && text.length < 30) {
          menuItems.push({ text, href: href || '' });
        }
      });

      return { url: location.href, title: document.title, links: links.slice(0, 30), menuItems: menuItems.slice(0, 20) };
    })()
  `);

  console.log('\n=== Navigation Menu ===');
  navData.menuItems.forEach(m => console.log(`  ${m.text} → ${m.href}`));

  console.log('\n=== Page Links ===');
  navData.links.slice(0, 15).forEach(l => console.log(`  ${l.text} → ${l.url}`));

  // Keep window open
  console.log('\n浏览器保持打开状态。可以继续手动浏览。');
  console.log('关闭窗口退出程序。');
});
