<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-25 | Updated: 2026-05-25 -->

# game-ad-desktop — Electron 桌面应用

## Purpose
游戏买量系统的桌面客户端，基于 Electron + React + Python。内置 ClickHouse 和 Redis 服务管理，用户无需安装 Docker 即可使用。包含标准模式和**管理者模式**两套界面。

## Key Files

| File | Description |
|------|-------------|
| `package.json` | Electron应用配置（入口: dist-electron/main.js） |
| `electron-builder.yml` | NSIS打包配置，输出到 release/ |
| `tsconfig.json` | TypeScript配置（target: ES2022, strict: true） |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `frontend/` | React前端 — Vite + Ant Design + ECharts + Zustand（见 `frontend/AGENTS.md`） |
| `backend/` | 桌面端Python后端 — 独立FastAPI服务（见 `backend/AGENTS.md`） |
| `electron/` | Electron主进程 — 窗口管理/服务管理/IPC通信/爬虫（见 `electron/AGENTS.md`） |
| `assets/` | 应用图标资源（icon.ico, icon.png） |
| `scripts/` | 构建和辅助脚本 |

## For AI Agents

### Working In This Directory
- 这是一个三层架构：Electron主进程 → Python后端 → React前端
- 前端通过 HTTP 调用后端API（localhost:8000），通过 IPC 与 Electron 主进程通信
- Electron ProcessManager 负责管理 ClickHouse/Redis/后端子进程生命周期
- 打包时后端通过 extraResources 嵌入安装目录

### 开发启动
```bash
# 方式1：前端开发（不启动Electron）
cd frontend && npm run dev              # Vite :5173
cd backend && uvicorn api.main:app      # FastAPI :8000

# 方式2：桌面开发（Vite + Electron热更新）
cd frontend && npm run electron:dev

# 打包
cd .. && npm run package                # 输出到 release/
```

### Testing Requirements
- 前端：TypeScript strict mode，Vite构建需通过
- 后端：pytest（详见 backend/AGENTS.md）

## Dependencies

### Internal
- `electron/process-manager.ts` 管理 `backend/` Python进程
- `electron/ipc-handlers.ts` 桥接前端和后端
- `frontend/src/services/api.ts` 调用后端API

### External
- Electron 28+ — 桌面壳
- Vite 5 — 前端构建
- electron-builder — 打包分发

<!-- MANUAL: -->