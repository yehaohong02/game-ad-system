import { BrowserWindow, session, DownloadItem, dialog, app } from 'electron';
import { CookieStore } from './cookie-store';
import * as path from 'path';
import * as fs from 'fs';

export interface DownloadButton {
  text: string;
  selector: string;
  confidence: number;
  tagName: string;
}

export interface DownloadRecord {
  platformId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  downloadedAt: string;
  status?: 'pending' | 'error' | 'done';
  error?: string;
}

type DownloadCallback = (record: DownloadRecord) => void;
type ScanProgressCallback = (data: { page: number; maxPages: number; url: string; found: number }) => void;

export interface ScannedPage {
  url: string;
  title: string;
  buttons: DownloadButton[];
}

export class CrawlerManager {
  private windows: Map<string, BrowserWindow> = new Map();
  private cookieStore: CookieStore;
  private downloads: Map<string, DownloadRecord[]> = new Map();
  private onDownloadComplete: DownloadCallback | null = null;
  private onScanProgress: ScanProgressCallback | null = null;
  private activeDownloads: Map<string, DownloadItem> = new Map();

  constructor() {
    this.cookieStore = new CookieStore();
  }

  setDownloadCallback(cb: DownloadCallback) {
    this.onDownloadComplete = cb;
  }

  setScanProgressCallback(cb: ScanProgressCallback) {
    this.onScanProgress = cb;
  }

  private setupDownloadHandler(win: BrowserWindow, platformId: string) {
    const ses = win.webContents.session;

    ses.on('will-download', (_event: Electron.Event, item: DownloadItem) => {
      // Only handle xlsx/xls/csv files
      const fileName = item.getFilename();
      const ext = path.extname(fileName).toLowerCase();
      if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
        item.cancel();
        return;
      }

      // Set save path
      const downloadDir = path.join(app.getPath('userData'), 'crawled', platformId);
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }
      const timestamp = Date.now();
      const safeName = fileName.replace(/[^a-zA-Z0-9._\-一-鿿]/g, '_');
      const savePath = path.join(downloadDir, `${timestamp}_${safeName}`);
      item.setSavePath(savePath);

      // Track active download
      const downloadId = `${platformId}_${timestamp}`;
      this.activeDownloads.set(downloadId, item);

      // Timeout control (30s)
      const timeout = setTimeout(() => {
        if (this.activeDownloads.has(downloadId)) {
          item.cancel();
          this.activeDownloads.delete(downloadId);

          // Notify renderer about timeout failure
          if (this.onDownloadComplete) {
            this.onDownloadComplete({
              platformId,
              filePath: savePath,
              fileName,
              fileSize: 0,
              downloadedAt: new Date().toISOString(),
              status: 'error',
              error: '下载超时（30秒）',
            });
          }
        }
      }, 30000);

      item.on('done', (_e: Electron.Event, state: string) => {
        clearTimeout(timeout);
        this.activeDownloads.delete(downloadId);

        if (state === 'completed') {
          const record: DownloadRecord = {
            platformId,
            filePath: savePath,
            fileName: fileName,
            fileSize: item.getReceivedBytes(),
            downloadedAt: new Date().toISOString(),
          };

          if (!this.downloads.has(platformId)) {
            this.downloads.set(platformId, []);
          }
          this.downloads.get(platformId)!.unshift(record);

          if (this.onDownloadComplete) {
            this.onDownloadComplete(record);
          }
        }
      });
    });
  }

  async openPlatform(platform: string, url: string): Promise<void> {
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      title: `${platform} - 平台数据`,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // 恢复 Cookie
    const cookies = await this.cookieStore.getCookies(platform);
    if (cookies.length > 0) {
      const ses = win.webContents.session;
      for (const cookie of cookies) {
        await ses.cookies.set({ url, ...cookie });
      }
    }

    win.loadURL(url);
    this.windows.set(platform, win);

    // Setup download handler for this window
    this.setupDownloadHandler(win, platform);

    // 定期保存 Cookie
    win.webContents.on('did-finish-load', async () => {
      const currentCookies = await win.webContents.session.cookies.get({});
      await this.cookieStore.saveCookies(platform, currentCookies);
    });

    win.on('closed', () => {
      this.windows.delete(platform);
    });
  }

  async injectScraper(platform: string, script: string): Promise<any> {
    const win = this.windows.get(platform);
    if (!win) throw new Error(`Platform ${platform} not open`);
    return win.webContents.executeJavaScript(script);
  }

  async autoLogin(platformId: string, credentials: { username: string; password: string; usernameSelector?: string; passwordSelector?: string; submitSelector?: string }): Promise<{ success: boolean; message: string }> {
    const win = this.windows.get(platformId);
    if (!win) return { success: false, message: 'Platform window not open' };

    const script = `
      (function() {
        const userSelector = '${credentials.usernameSelector || ''}' || 'input[type="email"], input[type="text"], input[name="username"], input[name="email"], input[name="account"]';
        const passSelector = '${credentials.passwordSelector || ''}' || 'input[type="password"]';
        const submitSelector = '${credentials.submitSelector || ''}' || 'button[type="submit"], input[type="submit"], button.login, button.submit';

        const userInput = document.querySelector(userSelector);
        const passInput = document.querySelector(passSelector);
        const submitBtn = document.querySelector(submitSelector);

        if (!userInput || !passInput) return JSON.stringify({ success: false, message: 'Cannot find login fields' });

        // Trigger React/Vue controlled inputs
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(userInput, '${credentials.username.replace(/'/g, "\\'")}');
        userInput.dispatchEvent(new Event('input', { bubbles: true }));
        userInput.dispatchEvent(new Event('change', { bubbles: true }));

        nativeInputValueSetter.call(passInput, '${credentials.password.replace(/'/g, "\\'")}');
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        passInput.dispatchEvent(new Event('change', { bubbles: true }));

        if (submitBtn) {
          setTimeout(() => submitBtn.click(), 500);
        }

        return JSON.stringify({ success: true, message: 'Credentials filled, submitting...' });
      })();
    `;

    try {
      const result = await win.webContents.executeJavaScript(script);
      return JSON.parse(result);
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  async extractHtml(platformId: string): Promise<string> {
    const win = this.windows.get(platformId);
    if (!win) throw new Error('Platform window not open');

    return await win.webContents.executeJavaScript(`
      (function() {
        const clone = document.documentElement.cloneNode(true);
        clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());
        return clone.outerHTML;
      })();
    `);
  }

  async runSelector(platformId: string, selector: string, attribute?: string): Promise<any[]> {
    const win = this.windows.get(platformId);
    if (!win) throw new Error('Platform window not open');

    const safeSelector = selector.replace(/'/g, "\\'");
    const attr = attribute || 'textContent';
    const safeAttr = attr.replace(/'/g, "\\'");
    const attrField = attr !== 'textContent' ? `attribute: el.getAttribute('${safeAttr}')?.trim(),` : '';

    return await win.webContents.executeJavaScript(`
      (function() {
        const elements = document.querySelectorAll('${safeSelector}');
        return Array.from(elements).map(el => ({
          text: el.textContent?.trim(),
          ${attrField}
        }));
      })();
    `);
  }

  async detectDownloadButtons(platformId: string): Promise<DownloadButton[]> {
    const win = this.windows.get(platformId);
    if (!win) throw new Error('Platform window not open');

    const script = `
      (function() {
        const keywords = ['导出', '下载', 'Export', 'Download', 'Excel', 'CSV', 'XLS', '导出全部', '导出数据', 'Export All', 'Export to Excel'];
        const candidates = document.querySelectorAll('button, a, div[role="button"], span[role="button"], li[role="button"], [onclick], .btn, .button, .el-button, .ant-btn');
        const results = [];

        candidates.forEach((el, index) => {
          const texts = [
            el.textContent?.trim() || '',
            el.getAttribute('title') || '',
            el.getAttribute('aria-label') || '',
            el.getAttribute('data-original-title') || '',
            el.innerText?.trim() || '',
          ].filter(t => t.length > 0);

          let confidence = 0;
          let matchedKeyword = '';

          for (const text of texts) {
            for (const kw of keywords) {
              if (text.toLowerCase().includes(kw.toLowerCase())) {
                const score = text.toLowerCase() === kw.toLowerCase() ? 1.0 :
                              text.length <= kw.length + 4 ? 0.9 : 0.7;
                if (score > confidence) {
                  confidence = score;
                  matchedKeyword = kw;
                }
              }
            }
          }

          if (confidence > 0) {
            // Generate a unique selector for this element
            let selector = '';
            if (el.id) {
              selector = '#' + el.id;
            } else if (el.getAttribute('data-testid')) {
              selector = '[data-testid="' + el.getAttribute('data-testid') + '"]';
            } else {
              const tag = el.tagName.toLowerCase();
              const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : '';
              selector = tag + cls;
              // Add nth-child if needed for uniqueness
              const parent = el.parentElement;
              if (parent) {
                const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
                if (siblings.length > 1) {
                  const idx = siblings.indexOf(el) + 1;
                  selector += ':nth-of-type(' + idx + ')';
                }
              }
            }

            results.push({
              text: matchedKeyword || texts[0],
              selector: selector,
              confidence: Math.round(confidence * 100) / 100,
              tagName: el.tagName.toLowerCase(),
            });
          }
        });

        // Sort by confidence descending
        results.sort((a, b) => b.confidence - a.confidence);
        return JSON.stringify(results);
      })();
    `;

    try {
      const raw = await win.webContents.executeJavaScript(script);
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async clickDownloadButton(platformId: string, selector: string): Promise<{ success: boolean; message: string }> {
    const win = this.windows.get(platformId);
    if (!win) return { success: false, message: 'Platform window not open' };

    const safeSelector = selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const script = `
      (function() {
        try {
          const el = document.querySelector('${safeSelector}');
          if (!el) return JSON.stringify({ success: false, message: 'Element not found' });
          el.scrollIntoView({ behavior: 'instant', block: 'center' });
          el.click();
          return JSON.stringify({ success: true, message: 'Button clicked' });
        } catch (e) {
          return JSON.stringify({ success: false, message: String(e) });
        }
      })();
    `;

    try {
      const result = await win.webContents.executeJavaScript(script);
      return JSON.parse(result);
    } catch (e) {
      return { success: false, message: String(e) };
    }
  }

  getDownloads(platformId: string): DownloadRecord[] {
    return this.downloads.get(platformId) ?? [];
  }

  async navigateToUrl(platformId: string, url: string): Promise<void> {
    const win = this.windows.get(platformId);
    if (!win) throw new Error('Platform window not open');
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Navigation timeout')), 15000);
      win.webContents.once('did-finish-load', () => {
        clearTimeout(timeout);
        resolve();
      });
      win.webContents.loadURL(url).catch(reject);
    });
  }

  getCurrentUrl(platformId: string): string {
    const win = this.windows.get(platformId);
    if (!win) throw new Error('Platform window not open');
    return win.webContents.getURL();
  }

  async discoverClickables(platformId: string): Promise<{ selector: string; text: string; tag: string }[]> {
    const win = this.windows.get(platformId);
    if (!win) throw new Error('Platform window not open');

    const script = `
      (function() {
        const candidates = document.querySelectorAll(
          'a[href], button, [role="tab"], [role="menuitem"], .ant-tabs-tab, .el-tabs__item, .el-menu-item, .ant-menu-item, .nav-item, .tab, [data-tab], [onclick]'
        );
        const results = [];
        for (const el of candidates) {
          const text = (el.textContent || '').trim().substring(0, 80);
          if (!text || text.length < 2) continue;
          // Skip hidden elements
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;

          let selector = '';
          if (el.id) {
            selector = '#' + el.id;
          } else if (el.getAttribute('data-testid')) {
            selector = '[data-testid="' + el.getAttribute('data-testid') + '"]';
          } else {
            const tag = el.tagName.toLowerCase();
            const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
            selector = tag + cls;
            const parent = el.parentElement;
            if (parent) {
              const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
              if (siblings.length > 1) {
                selector += ':nth-of-type(' + (siblings.indexOf(el) + 1) + ')';
              }
            }
          }

          const tag = el.tagName.toLowerCase();
          results.push({ selector, text, tag });
        }
        return JSON.stringify(results);
      })();
    `;

    try {
      const raw = await win.webContents.executeJavaScript(script);
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async autoScan(platformId: string, maxPages: number = 10): Promise<ScannedPage[]> {
    const win = this.windows.get(platformId);
    if (!win) throw new Error('Platform window not open');

    const startUrl = win.webContents.getURL();
    const visitedUrls = new Set<string>();
    const visitedSelectors = new Set<string>();
    const results: ScannedPage[] = [];

    const urlQueue: string[] = [startUrl];
    const MAX_CLICKS_PER_PAGE = 5;
    const SCAN_TIMEOUT = 60000;
    const startTime = Date.now();

    // Yield to event loop so UI stays responsive
    const yieldToEventLoop = () => new Promise<void>(r => setImmediate(r));

    while (urlQueue.length > 0 && visitedUrls.size < maxPages) {
      if (Date.now() - startTime > SCAN_TIMEOUT) break;
      await yieldToEventLoop();

      const url = urlQueue.shift()!;
      const normalized = url.split('#')[0].split('?')[0];
      if (visitedUrls.has(normalized)) continue;
      visitedUrls.add(normalized);

      if (this.onScanProgress) {
        this.onScanProgress({ page: visitedUrls.size, maxPages, url, found: results.reduce((s, p) => s + p.buttons.length, 0) });
      }

      try {
        await this.navigateToUrl(platformId, url);
        await new Promise(r => setTimeout(r, 800));
        await yieldToEventLoop();

        const title = await win.webContents.executeJavaScript('document.title || ""');
        const buttons = await this.detectDownloadButtons(platformId);

        if (buttons.length > 0) {
          results.push({ url, title, buttons });
        }

        const clickables = (await this.discoverClickables(platformId)).slice(0, MAX_CLICKS_PER_PAGE);

        for (const click of clickables) {
          if (Date.now() - startTime > SCAN_TIMEOUT) break;
          await yieldToEventLoop();

          const clickKey = `${normalized}::${click.selector}`;
          if (visitedSelectors.has(clickKey)) continue;
          visitedSelectors.add(clickKey);

          try {
            const urlBefore = win.webContents.getURL();

            await win.webContents.executeJavaScript(`
              (function() {
                const el = document.querySelector('${click.selector.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}');
                if (el) { el.scrollIntoView({behavior:'instant',block:'center'}); el.click(); }
              })();
            `);

            await new Promise(r => setTimeout(r, 800));

            const urlAfter = win.webContents.getURL();
            const navigated = urlAfter !== urlBefore;
            const normalizedAfter = urlAfter.split('#')[0].split('?')[0];

            if (navigated && !visitedUrls.has(normalizedAfter)) {
              const newTitle = await win.webContents.executeJavaScript('document.title || ""');
              const newButtons = await this.detectDownloadButtons(platformId);

              if (newButtons.length > 0) {
                results.push({ url: urlAfter, title: newTitle, buttons: newButtons });
              }

              urlQueue.push(urlAfter);

              try {
                await new Promise<void>((resolve) => {
                  const t = setTimeout(() => resolve(), 3000);
                  win.webContents.once('did-finish-load', () => { clearTimeout(t); resolve(); });
                  win.webContents.goBack();
                });
                await new Promise(r => setTimeout(r, 500));
              } catch {
                await this.navigateToUrl(platformId, url);
                await new Promise(r => setTimeout(r, 500));
              }
            } else if (navigated) {
              try {
                win.webContents.goBack();
                await new Promise(r => setTimeout(r, 500));
              } catch {
                await this.navigateToUrl(platformId, url);
                await new Promise(r => setTimeout(r, 500));
              }
            }
            if (!navigated) {
              const afterButtons = await this.detectDownloadButtons(platformId);
              if (afterButtons.length > buttons.length) {
                results.push({ url, title, buttons: afterButtons });
              }
            }
          } catch {
            // Skip failed clicks
          }
        }
      } catch {
        // Skip pages that fail to load
      }
    }

    try {
      await this.navigateToUrl(platformId, startUrl);
    } catch {}

    return results;
  }

  closePlatform(platformId: string): void {
    const win = this.windows.get(platformId);
    if (win) {
      win.close();
      this.windows.delete(platformId);
    }
  }

  closeAll(): void {
    for (const [, win] of this.windows) {
      win.close();
    }
    this.windows.clear();
  }
}
