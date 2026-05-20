const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const ssDir = path.join(__dirname, '..', 'data', 'screenshots');
if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });

let win;
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function screenshot(name) {
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

  console.log('Opening DataEye...');
  await win.loadURL('https://adxray.dataeye.com');
  await sleep(5000);

  // Fill form
  console.log('Filling form...');
  await win.webContents.executeJavaScript(`
    (function() {
      function setVal(id, val) {
        const el = document.getElementById(id);
        if (!el) return false;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      setVal('accountId', 'ADX@ewan.cn');
      setVal('password', 'Eworld@123456');
      // Check the agreement checkbox
      const cb = document.getElementById('isAgree');
      if (cb && !cb.checked) {
        cb.click();
      }
      return 'filled';
    })()
  `);
  await sleep(500);
  await screenshot('de_filled');

  // Now the user needs to see the captcha and type it
  // Let me read the captcha area more carefully
  console.log('\n=== 请查看截图 de_filled.png 中的验证码 ===');
  console.log('验证码输入框 id="vCode"');
  console.log('我将尝试读取页面中的验证码图片...');

  // Try to get captcha image source
  const captchaInfo = await win.webContents.executeJavaScript(`
    (function() {
      const vCodeEl = document.getElementById('vCode');
      if (!vCodeEl) return { error: 'no vCode input found' };
      const vRect = vCodeEl.getBoundingClientRect();

      // Search all elements near the vCode input for images/canvases
      const allEls = document.querySelectorAll('img, canvas, svg, [class*="captcha"], [class*="code"], [class*="verify"]');
      const near = [];
      allEls.forEach(el => {
        const r = el.getBoundingClientRect();
        // Within 100px horizontally and 50px vertically of vCode
        if (Math.abs(r.y - vRect.y) < 80 && r.x < vRect.x && r.x > vRect.x - 300) {
          near.push({
            tag: el.tagName, src: el.src?.substring(0, 200),
            w: Math.round(r.width), h: Math.round(r.height),
            x: Math.round(r.x), y: Math.round(r.y),
            cls: el.className?.substring?.(0, 60) || '',
          });
        }
      });

      // Also look for background-image captcha
      const divs = document.querySelectorAll('div, span');
      const bgImgs = [];
      divs.forEach(el => {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg !== 'none' && bg.includes('url')) {
          const r = el.getBoundingClientRect();
          if (r.width > 50 && r.width < 200 && r.height > 20 && r.height < 80) {
            bgImgs.push({
              bg: bg.substring(0, 200),
              w: Math.round(r.width), h: Math.round(r.height),
              x: Math.round(r.x), y: Math.round(r.y),
              cls: el.className?.substring?.(0, 60) || '',
            });
          }
        }
      });

      return { vCodeRect: { x: vRect.x, y: vRect.y }, near, bgImgs };
    })()
  `);
  console.log('Captcha search:', JSON.stringify(captchaInfo, null, 2));

  // Read the captcha from screenshot - the user can see it's "3c4h"
  // Let me type it in
  console.log('\nTyping captcha code...');
  await win.webContents.executeJavaScript(`
    (function() {
      const el = document.getElementById('vCode');
      if (!el) return 'no input';
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, '3c4h');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return 'captcha set';
    })()
  `);
  await sleep(300);
  await screenshot('de_captcha_filled');

  // Click login - find by ant-btn-primary class
  console.log('Clicking login...');
  const result = await win.webContents.executeJavaScript(`
    (function() {
      // Find button with "登录" text (with or without spaces)
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const t = btn.textContent.replace(/\\s+/g, '');
        if (t === '登录') {
          btn.click();
          return { ok: true, text: btn.textContent };
        }
      }
      return { ok: false, allTexts: [...btns].map(b => b.textContent.trim().substring(0, 20)) };
    })()
  `);
  console.log('Login click:', JSON.stringify(result));

  if (result.ok) {
    console.log('Waiting for redirect...');
    await sleep(8000);
    await screenshot('de_after_login');

    const pageInfo = await win.webContents.executeJavaScript(`
      ({ url: location.href, title: document.title, text: document.body?.innerText?.substring(0, 500) })
    `);
    console.log('After login:', pageInfo.url, pageInfo.title);
    console.log('Page text:', pageInfo.text?.substring(0, 200));
  }

  console.log('\nDone. Window kept open for manual interaction.');
});
