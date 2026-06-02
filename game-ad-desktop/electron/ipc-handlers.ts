import { ipcMain, BrowserWindow } from 'electron';
import { ProcessManager } from './process-manager';
import { CrawlerManager } from './crawler/crawler-manager';
import { CredentialStore } from './crawler/credential-store';
import { PlatformConfigStore } from './crawler/platform-config-store';
import { BookmarkStore } from './crawler/bookmark-store';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { sanitizeId } from './utils';

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

const IPC_CHANNELS = [
  'get-service-status', 'get-system-info',
  'crawler:open-platform', 'crawler:auto-login', 'crawler:extract-html',
  'crawler:run-selector', 'crawler:close-platform', 'crawler:get-platforms',
  'crawler:save-platform', 'crawler:delete-platform', 'crawler:save-credentials',
  'crawler:get-credentials', 'crawler:get-bookmarks', 'crawler:add-bookmark',
  'crawler:delete-bookmark', 'crawler:navigate', 'crawler:get-url',
  'crawler:auto-scan', 'crawler:detect-downloads', 'crawler:click-download',
  'crawler:get-downloads', 'read-local-file', 'list-crawled-files',
];

export function cleanupIPC(): void {
  for (const channel of IPC_CHANNELS) {
    ipcMain.removeHandler(channel);
  }
}

export function setupIPC(win: BrowserWindow, pm: ProcessManager, crawlerManager: CrawlerManager) {
  cleanupIPC();
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
    const safeId = sanitizeId(platformId);
    await crawlerManager.openPlatform(safeId, url);
    return { success: true };
  });

  ipcMain.handle('crawler:auto-login', async (_e, platformId: string, credentials: { username: string; password: string; usernameSelector?: string; passwordSelector?: string; submitSelector?: string }) => {
    const safeId = sanitizeId(platformId);
    return await crawlerManager.autoLogin(safeId, credentials);
  });

  ipcMain.handle('crawler:extract-html', async (_e, platformId: string) => {
    const safeId = sanitizeId(platformId);
    return await crawlerManager.extractHtml(safeId);
  });

  ipcMain.handle('crawler:run-selector', async (_e, platformId: string, selector: string, attribute?: string) => {
    const safeId = sanitizeId(platformId);
    return await crawlerManager.runSelector(safeId, selector, attribute);
  });

  ipcMain.handle('crawler:close-platform', async (_e, platformId: string) => {
    const safeId = sanitizeId(platformId);
    crawlerManager.closePlatform(safeId);
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
    const safeId = sanitizeId(platformId);
    credentialStore.saveCredentials(safeId, credentials);
    return { success: true };
  });

  ipcMain.handle('crawler:get-credentials', async (_e, platformId: string) => {
    const safeId = sanitizeId(platformId);
    return credentialStore.getCredentials(safeId);
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
    const safeId = sanitizeId(platformId);
    await crawlerManager.navigateToUrl(safeId, url);
    return { success: true };
  });

  ipcMain.handle('crawler:get-url', async (_e, platformId: string) => {
    const safeId = sanitizeId(platformId);
    return crawlerManager.getCurrentUrl(safeId);
  });

  ipcMain.handle('crawler:auto-scan', async (_e, platformId: string, maxPages?: number) => {
    const safeId = sanitizeId(platformId);
    return await crawlerManager.autoScan(safeId, maxPages ?? 10);
  });

  ipcMain.handle('crawler:detect-downloads', async (_e, platformId: string) => {
    const safeId = sanitizeId(platformId);
    const buttons = await crawlerManager.detectDownloadButtons(safeId);
    return { buttons };
  });

  ipcMain.handle('crawler:click-download', async (_e, platformId: string, selector: string) => {
    const safeId = sanitizeId(platformId);
    return await crawlerManager.clickDownloadButton(safeId, selector);
  });

  ipcMain.handle('crawler:get-downloads', async (_e, platformId: string) => {
    const safeId = sanitizeId(platformId);
    const files = crawlerManager.getDownloads(safeId);
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

  // Security: restrict file access to userData/crawled/ directory
  const allowedBase = path.join(require('electron').app.getPath('userData'), 'crawled');

  function isPathAllowed(targetPath: string): boolean {
    const resolved = path.resolve(targetPath);
    return resolved.startsWith(allowedBase + path.sep) || resolved === allowedBase;
  }

  // File read handler for import (restricted to allowedBase)
  ipcMain.handle('read-local-file', async (_e, filePath: string) => {
    const resolved = path.resolve(filePath);
    if (!isPathAllowed(resolved)) {
      throw new Error('Access denied: path outside allowed directory');
    }
    const buffer = await fs.promises.readFile(resolved);
    return buffer.toString('base64');
  });

  // List crawled data files (restricted to allowedBase)
  ipcMain.handle('list-crawled-files', async (_e, crawlDir: string) => {
    const resolved = path.resolve(crawlDir);
    if (!isPathAllowed(resolved)) {
      throw new Error('Access denied: path outside allowed directory');
    }
    const result: { name: string; path: string; size: number; dir: string }[] = [];
    const walk = (dir: string, rel: string, depth: number, maxDepth: number = 10) => {
      if (depth > maxDepth || !fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        const relPath = rel ? `${rel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          walk(fullPath, relPath, depth + 1, maxDepth);
        } else if (/\.xlsx?$/i.test(entry.name)) {
          result.push({ name: entry.name, path: fullPath, size: fs.statSync(fullPath).size, dir: rel });
        }
      }
    };
    walk(resolved, '', 0);
    return result;
  });
}