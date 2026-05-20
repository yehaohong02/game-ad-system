import { contextBridge, ipcRenderer } from 'electron';

const notificationListeners = new Map<Function, Function>();

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
    startCrawl: (url: string) => ipcRenderer.invoke('start-crawl', url),
    getCrawlResult: () => ipcRenderer.invoke('get-crawl-result'),
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
    navigateToUrl: (platformId: string, url: string) => ipcRenderer.invoke('crawler:navigate', platformId, url),
    getCurrentUrl: (platformId: string) => ipcRenderer.invoke('crawler:get-url', platformId),
    autoScan: (platformId: string, maxPages?: number) => ipcRenderer.invoke('crawler:auto-scan', platformId, maxPages),
    detectDownloads: (platformId: string) => ipcRenderer.invoke('crawler:detect-downloads', platformId),
    clickDownload: (platformId: string, selector: string) => ipcRenderer.invoke('crawler:click-download', platformId, selector),
    getDownloads: (platformId: string) => ipcRenderer.invoke('crawler:get-downloads', platformId),
    onDownloadComplete: (cb: (data: any) => void) => {
      const wrapper = (_: any, data: any) => cb(data);
      ipcRenderer.on('crawler:download-complete', wrapper);
    },
    onScanProgress: (cb: (data: { page: number; maxPages: number; url: string; found: number }) => void) => {
      const wrapper = (_: any, data: any) => cb(data);
      ipcRenderer.on('crawler:scan-progress', wrapper);
    },
    readLocalFile: (filePath: string) => ipcRenderer.invoke('read-local-file', filePath),
    listCrawledFiles: (crawlDir: string) => ipcRenderer.invoke('list-crawled-files', crawlDir),
  },
});
