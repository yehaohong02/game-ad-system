const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Browser control
  navigate: (url) => ipcRenderer.invoke('browser:navigate', url),
  extract: (query) => ipcRenderer.invoke('browser:extract', query),
  getPageInfo: () => ipcRenderer.invoke('browser:getPageInfo'),
  goBack: () => ipcRenderer.invoke('browser:goBack'),
  goForward: () => ipcRenderer.invoke('browser:goForward'),
  reload: () => ipcRenderer.invoke('browser:reload'),
  closeBrowser: () => ipcRenderer.invoke('browser:close'),
  showBrowser: (bounds) => ipcRenderer.invoke('browser:show', bounds),
  hideBrowser: () => ipcRenderer.invoke('browser:hide'),
  screenshot: (opts) => ipcRenderer.invoke('browser:screenshot', opts),
  downloadMedia: () => ipcRenderer.invoke('browser:downloadMedia'),

  // Screenshot workflow - flow management
  flowSave: (data) => ipcRenderer.invoke('flow:save', data),
  flowList: () => ipcRenderer.invoke('flow:list'),
  flowLoad: (name) => ipcRenderer.invoke('flow:load', name),
  flowDelete: (name) => ipcRenderer.invoke('flow:delete', name),
  batchScreenshot: (opts) => ipcRenderer.invoke('browser:batchScreenshot', opts),

  // Screenshot management
  screenshotList: () => ipcRenderer.invoke('screenshot:list'),
  screenshotOpen: (filename) => ipcRenderer.invoke('screenshot:open', filename),

  // Click recording
  startRecording: () => ipcRenderer.invoke('browser:startRecording'),
  stopRecording: () => ipcRenderer.invoke('browser:stopRecording'),
  getRecordedClicks: () => ipcRenderer.invoke('browser:getRecordedClicks'),

  // Auto crawl screenshots
  autoCrawlScreenshots: (opts) => ipcRenderer.invoke('browser:autoCrawlScreenshots', opts),

  // Load saved analysis
  loadAnalysis: () => ipcRenderer.invoke('browser:loadAnalysis'),

  // Crawl engine
  startCrawl: (options) => ipcRenderer.invoke('crawl:start', options),
  stopCrawl: () => ipcRenderer.invoke('crawl:stop'),

  // Crawl events
  onCrawlProgress: (callback) => {
    ipcRenderer.on('crawl:progress', (_e, data) => callback(data));
  },
  onCrawlData: (callback) => {
    ipcRenderer.on('crawl:data', (_e, data) => callback(data));
  },
  onCrawlComplete: (callback) => {
    ipcRenderer.on('crawl:complete', (_e, data) => callback(data));
  },
  onCrawlError: (callback) => {
    ipcRenderer.on('crawl:error', (_e, data) => callback(data));
  },
  removeCrawlListeners: () => {
    ipcRenderer.removeAllListeners('crawl:progress');
    ipcRenderer.removeAllListeners('crawl:data');
    ipcRenderer.removeAllListeners('crawl:complete');
    ipcRenderer.removeAllListeners('crawl:error');
  },

  // DataEye 分板块爬虫
  dataeyeCrawl: (options) => ipcRenderer.invoke('dataeye:crawl', options),
  dataeyeStop: () => ipcRenderer.invoke('dataeye:stop'),
  onDataeyeProgress: (callback) => {
    ipcRenderer.on('dataeye:progress', (_e, data) => callback(data));
  },
  onDataeyeData: (callback) => {
    ipcRenderer.on('dataeye:data', (_e, data) => callback(data));
  },
  onDataeyeComplete: (callback) => {
    ipcRenderer.on('dataeye:complete', (_e, data) => callback(data));
  },
  onDataeyeError: (callback) => {
    ipcRenderer.on('dataeye:error', (_e, data) => callback(data));
  },
  removeDataeyeListeners: () => {
    ipcRenderer.removeAllListeners('dataeye:progress');
    ipcRenderer.removeAllListeners('dataeye:data');
    ipcRenderer.removeAllListeners('dataeye:complete');
    ipcRenderer.removeAllListeners('dataeye:error');
  },
});
