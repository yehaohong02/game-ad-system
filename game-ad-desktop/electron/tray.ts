import { Tray, Menu, BrowserWindow, app } from 'electron';
import * as path from 'path';
import { ProcessManager } from './process-manager';

let refreshInterval: ReturnType<typeof setInterval> | null = null;
let trayInstance: Tray | null = null;

export function createTray(win: BrowserWindow, pm: ProcessManager): Tray {
  const tray = new Tray(path.join(__dirname, '../assets/tray-icon.png'));
  trayInstance = tray;

  function buildContextMenu(): Menu {
    const status = pm.getStatus();
    const statusItems = Object.entries(status).map(([name, state]) => ({
      label: `${name}: ${state}`,
      enabled: false,
    }));
    if (statusItems.length === 0) {
      statusItems.push({ label: '无服务运行', enabled: false });
    }

    return Menu.buildFromTemplate([
      { label: '打开主窗口', click: () => { win.show(); win.focus(); } },
      { type: 'separator' },
      { label: '服务状态', submenu: statusItems },
      { type: 'separator' },
      { label: '退出', click: () => { app.quit(); } },
    ]);
  }

  tray.setToolTip('游戏买量系统');
  tray.setContextMenu(buildContextMenu());
  tray.on('double-click', () => { win.show(); win.focus(); });
  // Refresh status menu every 5 seconds
  refreshInterval = setInterval(() => tray.setContextMenu(buildContextMenu()), 5000);

  return tray;
}

export function cleanupTray(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  if (trayInstance && !trayInstance.isDestroyed()) {
    trayInstance.destroy();
    trayInstance = null;
  }
}