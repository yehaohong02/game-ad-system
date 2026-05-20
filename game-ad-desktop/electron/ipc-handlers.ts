import { ipcMain, BrowserWindow } from 'electron';
import { ProcessManager } from './process-manager';
import { CrawlerManager } from './crawler/crawler-manager';
import { CredentialStore } from './crawler/credential-store';
import { PlatformConfigStore } from './crawler/platform-config-store';
import { BookmarkStore } from './crawler/bookmark-store';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const cpus = os.cpus();
    const totalBefore = cpus.reduce((acc, cpu) => {
      const times = Object.values(cpu.times);
      return acc + times.reduce((a, b) => a + b, 0);
    }, 0);
    const idleBefore = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);

    setTimeout(() => {
      const cpusAfter = os.cpus();
      const totalAfter = cpusAfter.reduce((acc, cpu) => {
        const times = Object.values(cpu.times);
        return acc + times.reduce((a, b) => a + b, 0);
      }, 0);
      const idleAfter = cpusAfter.reduce((acc, cpu) => acc + cpu.times.idle, 0);

      const totalDiff = totalAfter - totalBefore;
      const idleDiff = idleAfter - idleBefore;
      const usage = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0;
      resolve(Math.round(usage * 100) / 100);
    }, 100);
  });
}

export function setupIPC(win: BrowserWindow, pm: ProcessManager, crawlerManager: CrawlerManager) {
  ipcMain.handle('get-service-status', () => pm.getStatus());

  ipcMain.handle('get-system-info', async () => ({
    cpuUsage: await getCpuUsage(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    platform: os.platform(),
  }));

  // --- Crawler IPC Handlers ---
  const credentialStore = new CredentialStore();
  const platformConfigStore = new PlatformConfigStore();
  const bookmarkStore = new BookmarkStore();

  ipcMain.handle('crawler:open-platform', async (_e, platformId: string, url: string) => {
    await crawlerManager.openPlatform(platformId, url);
    return { success: true };
  });

  ipcMain.handle('crawler:auto-login', async (_e, platformId: string, credentials: { username: string; password: string; usernameSelector?: string; passwordSelector?: string; submitSelector?: string }) => {
    return await crawlerManager.autoLogin(platformId, credentials);
  });

  ipcMain.handle('crawler:extract-html', async (_e, platformId: string) => {
    return await crawlerManager.extractHtml(platformId);
  });

  ipcMain.handle('crawler:run-selector', async (_e, platformId: string, selector: string, attribute?: string) => {
    return await crawlerManager.runSelector(platformId, selector, attribute);
  });

  ipcMain.handle('crawler:close-platform', async (_e, platformId: string) => {
    crawlerManager.closePlatform(platformId);
    return { success: true };
  });

  ipcMain.handle('crawler:get-platforms', async () => {
    return platformConfigStore.getAll();
  });

  ipcMain.handle('crawler:save-platform', async (_e, config: any) => {
    platformConfigStore.saveConfig(config);
    return { success: true };
  });

  ipcMain.handle('crawler:delete-platform', async (_e, id: string) => {
    return { success: platformConfigStore.delete(id) };
  });

  ipcMain.handle('crawler:save-credentials', async (_e, platformId: string, credentials: { username: string; password: string }) => {
    credentialStore.saveCredentials(platformId, credentials);
    return { success: true };
  });

  ipcMain.handle('crawler:get-credentials', async (_e, platformId: string) => {
    return credentialStore.getCredentials(platformId);
  });

  // --- Bookmark IPC Handlers ---
  ipcMain.handle('crawler:get-bookmarks', async () => {
    return bookmarkStore.getAll();
  });

  ipcMain.handle('crawler:add-bookmark', async (_e, name: string, url: string) => {
    return bookmarkStore.add(name, url);
  });

  ipcMain.handle('crawler:delete-bookmark', async (_e, id: string) => {
    return bookmarkStore.delete(id);
  });

  // --- Download IPC Handlers ---

  ipcMain.handle('crawler:navigate', async (_e, platformId: string, url: string) => {
    await crawlerManager.navigateToUrl(platformId, url);
    return { success: true };
  });

  ipcMain.handle('crawler:get-url', async (_e, platformId: string) => {
    return crawlerManager.getCurrentUrl(platformId);
  });

  ipcMain.handle('crawler:auto-scan', async (_e, platformId: string, maxPages?: number) => {
    return await crawlerManager.autoScan(platformId, maxPages ?? 10);
  });

  ipcMain.handle('crawler:detect-downloads', async (_e, platformId: string) => {
    const buttons = await crawlerManager.detectDownloadButtons(platformId);
    return { buttons };
  });

  ipcMain.handle('crawler:click-download', async (_e, platformId: string, selector: string) => {
    return await crawlerManager.clickDownloadButton(platformId, selector);
  });

  ipcMain.handle('crawler:get-downloads', async (_e, platformId: string) => {
    const files = crawlerManager.getDownloads(platformId);
    return { files };
  });

  // Register download complete callback → forward to renderer
  crawlerManager.setDownloadCallback((record) => {
    win.webContents.send('crawler:download-complete', record);
  });

  // Register scan progress callback → forward to renderer
  crawlerManager.setScanProgressCallback((data) => {
    win.webContents.send('crawler:scan-progress', data);
  });

  // File read handler for import
  ipcMain.handle('read-local-file', async (_e, filePath: string) => {
    const buffer = fs.readFileSync(filePath);
    return Array.from(buffer);
  });

  // List crawled data files
  ipcMain.handle('list-crawled-files', async (_e, crawlDir: string) => {
    const result: { name: string; path: string; size: number; dir: string }[] = [];
    const walk = (dir: string, rel: string) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        const relPath = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(fullPath, relPath);
        } else if (/\.xlsx?$/i.test(entry.name)) {
          result.push({ name: entry.name, path: fullPath, size: fs.statSync(fullPath).size, dir: rel });
        }
      }
    };
    walk(crawlDir, '');
    return result;
  });
}
