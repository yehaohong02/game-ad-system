import { Tray, Menu, BrowserWindow, app } from 'electron';
import * as path from 'path';
import { ProcessManager } from './process-manager';

export function createTray(win: BrowserWindow, pm: ProcessManager): Tray {
  const tray = new Tray(path.join(__dirname, '../assets/tray-icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    { label: '打开主窗口', click: () => { win.show(); win.focus(); } },
    { type: 'separator' },
    { label: '服务状态', submenu: [] },
    { type: 'separator' },
    { label: '退出', click: () => { app.quit(); } },
  ]);

  tray.setToolTip('游戏买量系统');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { win.show(); win.focus(); });

  return tray;
}
