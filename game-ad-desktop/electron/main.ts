import { app, BrowserWindow, Tray, Menu } from 'electron';
import * as path from 'path';
import { ProcessManager } from './process-manager';
import { CrawlerManager } from './crawler/crawler-manager';
import { setupIPC } from './ipc-handlers';
import { createTray } from './tray';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let processManager: ProcessManager;

const isPackaged = app.isPackaged;
const isDev = !isPackaged;

const SERVICES = [
  { name: 'clickhouse', command: 'services/clickhouse/clickhouse.exe', args: ['server'], port: 8123, maxRestarts: 3 },
  { name: 'redis', command: 'services/redis/redis-server.exe', args: [], port: 6379, maxRestarts: 3 },
  { name: 'backend', command: 'backend/dist/api.exe', args: [], port: 8000, maxRestarts: 2 },
];

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1440,
    minHeight: 900,
    title: '买量个人数据分析平台--海外三组开发',
    icon: path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow?.hide();
  });
}

app.whenReady().then(async () => {
  processManager = new ProcessManager(SERVICES);
  const crawlerManager = new CrawlerManager();

  try {
    await processManager.startAll();
  } catch (err) {
    console.error('Failed to start services:', err);
  }

  await createWindow();
  if (mainWindow) {
    try {
      tray = createTray(mainWindow, processManager);
    } catch (err) {
      console.error('Failed to create tray:', err);
    }
    setupIPC(mainWindow, processManager, crawlerManager);
  } else {
    console.error('Failed to create main window');
  }
});

app.on('window-all-closed', () => {
  // 不退出，托盘驻留
});

app.on('before-quit', async () => {
  mainWindow?.removeAllListeners('close');
  await processManager.stopAll();
});
