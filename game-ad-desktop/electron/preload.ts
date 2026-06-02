import { contextBridge, ipcRenderer } from 'electron';

const notificationListeners = new Map<Function, Function>();
const downloadCompleteListeners = new Map<Function, Function>();
const scanProgressListeners = new Map<Function, Function>();

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  getServiceStatus: () => ipcRenderer.invoke('get-service-status'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  onNotification: (cb: (data: any) => void) => {
    const wrapper = (_: any, data: any) => cb(data);
    notificationListeners.set(cb, wrapper);
    ipcRenderer.on('notification', wrapper);
  },
  removeNotificationListener: (cb: (data: any) => void) => {
    const wrapper = notificationListeners.get(cb);
    if (wrapper) {
      ipcRenderer.removeListener('notification', wrapper as any);
      notificationListeners.delete(cb);
    }
  },
  platformData: {
    openPlatform: (platformId: string, url: string) => ipcRenderer.invoke('crawler:open-platform', platformId, url),
    autoLogin: (platformId: string, credentials: { username: string; password: string }) => ipcRenderer.invoke('crawler:auto-login', platformId, credentials),
    extractHtml: (platformId: string) => ipcRenderer.invoke('crawler:extract-html', platformId),
    runSelector: (platformId: string, selector: string, attribute?: string) => ipcRenderer.invoke('crawler:run-selector', platformId, selector, attribute),
    closePlatform: (platformId: string) => ipcRenderer.invoke('crawler:close-platform', platformId),
    getPlatforms: () => ipcRenderer.invoke('crawler:get-platforms'),
    savePlatform: (config: any) => ipcRenderer.invoke('crawler:save-platform', config),
    deletePlatform: (id: string) => ipcRenderer.invoke('crawler:delete-platform', id),
    saveCredentials: (platformId: string, credentials: { username: string; password: string }) => ipcRenderer.invoke('crawler:save-credentials', platformId, credentials),
    getCredentials: (platformId: string) => ipcRenderer.invoke('crawler:get-credentials', platformId),
    getBookmarks: () => ipcRenderer.invoke('crawler:get-bookmarks'),
    addBookmark: (name: string, url: string) => ipcRenderer.invoke('crawler:add-bookmark', name, url),
    deleteBookmark: (id: string) => ipcRenderer.invoke('crawler:delete-bookmark', id),
    navigateToUrl: (platformId: string, url: string) => {
      if (!isValidUrl(url)) {
        return Promise.reject(new Error(`Invalid or unsafe URL: ${url}`));
      }
      return ipcRenderer.invoke('crawler:navigate', platformId, url);
    },
    getCurrentUrl: (platformId: string) => ipcRenderer.invoke('crawler:get-url', platformId),
    autoScan: (platformId: string, maxPages?: number) => ipcRenderer.invoke('crawler:auto-scan', platformId, maxPages),
    detectDownloads: (platformId: string) => ipcRenderer.invoke('crawler:detect-downloads', platformId),
    clickDownload: (platformId: string, selector: string) => ipcRenderer.invoke('crawler:click-download', platformId, selector),
    getDownloads: (platformId: string) => ipcRenderer.invoke('crawler:get-downloads', platformId),
    onDownloadComplete: (cb: (data: any) => void) => {
      const wrapper = (_: any, data: any) => cb(data);
      downloadCompleteListeners.set(cb, wrapper);
      ipcRenderer.on('crawler:download-complete', wrapper);
    },
    removeDownloadCompleteListener: (cb: (data: any) => void) => {
      const wrapper = downloadCompleteListeners.get(cb);
      if (wrapper) {
        ipcRenderer.removeListener('crawler:download-complete', wrapper as any);
        downloadCompleteListeners.delete(cb);
      }
    },
    onScanProgress: (cb: (data: { page: number; maxPages: number; url: string; found: number }) => void) => {
      const wrapper = (_: any, data: any) => cb(data);
      scanProgressListeners.set(cb, wrapper);
      ipcRenderer.on('crawler:scan-progress', wrapper);
    },
    removeScanProgressListener: (cb: (data: any) => void) => {
      const wrapper = scanProgressListeners.get(cb);
      if (wrapper) {
        ipcRenderer.removeListener('crawler:scan-progress', wrapper as any);
        scanProgressListeners.delete(cb);
      }
    },
    readLocalFile: (filePath: string) => ipcRenderer.invoke('read-local-file', filePath),
    listCrawledFiles: (crawlDir: string) => ipcRenderer.invoke('list-crawled-files', crawlDir),
  },
});