<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-25 | Updated: 2026-05-25 -->

# electron — Electron 主进程

## Purpose
Electron桌面应用的主进程，负责窗口创建、系统托盘、子进程管理（ClickHouse/Redis/后端）、IPC通信，以及内置的竞品数据爬虫引擎。

## Key Files

| File | Description |
|------|-------------|
| `main.ts` | 主进程入口 — 窗口创建、服务管理启动、应用生命周期 |
| `preload.ts` | 预加载脚本 — 暴露 window.electronAPI 给渲染进程 |
| `process-manager.ts` | 子进程管理 — 管理ClickHouse/Redis/Python后端进程的启停 |
| `tray.ts` | 系统托盘 — 最小化到托盘、右键菜单 |
| `ipc-handlers.ts` | IPC处理 — 主进程与渲染进程的通信桥接 |
| `crawler/crawler-manager.ts` | 爬虫管理器 — Playwright浏览器自动化调度 |
| `crawler/platform-config-store.ts` | 平台配置存储 |
| `crawler/credential-store.ts` | 凭证存储（加密） |
| `crawler/cookie-store.ts` | Cookie持久化 |
| `crawler/bookmark-store.ts` | 书签/收藏管理 |
| `crawler/injectors/base.injector.ts` | 爬虫注入器基类 |
| `crawler/injectors/guangdada.injector.ts` | 广大大平台注入器 |
| `crawler/injectors/universal.injector.ts` | 通用平台注入器 |

## For AI Agents

### Working In This Directory
- TypeScript strict mode，ES2022 target，CommonJS模块
- 编译输出到 `dist-electron/`
- `main.ts` 是应用入口（package.json main字段指向 dist-electron/main.js）
- 爬虫模块使用 Playwright 进行浏览器自动化

### 架构流程
```
main.ts
  ├─ 创建 BrowserWindow → 加载 Vite 开发服务器或 dist/index.html
  ├─ 启动 ProcessManager → ClickHouse + Redis + Python后端
  ├─ 注册 IPC Handlers → 前端调用 Electron API
  ├─ 创建 Tray → 系统托盘管理
  └─ 初始化 CrawlerManager → 竞品数据采集
```

### 构建
```bash
tsc -b                          # 编译到 dist-electron/
npm run electron:dev            # 开发模式（Vite热更新 + Electron）
```

## Dependencies

### Internal
- `frontend/` — 渲染进程（通过 BrowserWindow加载）
- `backend/` — Python后端（通过 ProcessManager 启动）
- `frontend/dist/` — 生产构建产物

### External
- Electron — 桌面框架
- Playwright — 爬虫浏览器自动化（playwright-core）

<!-- MANUAL: -->