<!-- Generated: 2026-05-25 | Updated: 2026-05-25 -->

# 游戏买量系统 (Game Ad System)

## Purpose
游戏广告买量自动化系统，基于多Agent协作架构（DATA → CREATIVE → EXECUTION → SAFETY → MEMORY），覆盖数据采集、创意分析、投放执行、安全防护、记忆沉淀全链路。包含 Python 后端服务 + Electron/React 桌面应用。

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend API | Python + FastAPI | >=3.11 / 0.109+ |
| Desktop Backend | Python + FastAPI | >=3.11 / 0.109+ |
| Frontend | React + TypeScript + Vite | 18.2+ / 5.3+ / 5.1+ |
| Desktop Shell | Electron | 28+ |
| UI Library | Ant Design (antd) | 5.15+ |
| Charts | ECharts (echarts-for-react) | 5.6+ |
| State Management | Zustand | 4.5+ |
| Database | ClickHouse | via clickhouse-connect |
| Cache | Redis | 5.0+ |
| Orchestration | Apache Airflow | 2.8+ |
| AI/LLM | LangChain + OpenAI | 0.1+ |
| Vector DB | ChromaDB | 0.4+ |
| Packaging | PyInstaller (backend) + electron-builder (desktop) | — |

## Key Files

| File | Description |
|------|-------------|
| `CLAUDE.md` | 项目指令 — 多Agent协作协议，每次会话自动加载 |
| `README.md` | 完整项目文档 — 快速开始、API概览、环境变量、FAQ |
| `game-ad-system/pyproject.toml` | 后端Python依赖定义 |
| `game-ad-system/Makefile` | 后端常用命令（up/down/test/lint/dev等） |
| `game-ad-system/launcher.py` | 一键启动器（FastAPI + 自动打开浏览器） |
| `game-ad-desktop/package.json` | Electron应用配置和脚本 |
| `game-ad-desktop/frontend/package.json` | 前端依赖（React/Antd/ECharts/Zustand等） |
| `game-ad-desktop/backend/pyproject.toml` | 桌面端Python后端依赖 |
| `game-ad-desktop/electron-builder.yml` | Electron打包配置（NSIS安装程序） |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `game-ad-system/` | Python后端服务 — FastAPI + Airflow + ClickHouse（见 `game-ad-system/AGENTS.md`） |
| `game-ad-desktop/` | Electron桌面应用 — React前端 + Python后端（见 `game-ad-desktop/AGENTS.md`） |
| `docs/` | 项目文档和规格说明 |
| `scripts/` | 构建和工具脚本 |
| `数据/` | 数据文件存储目录 |

## For AI Agents

### Working In This Project
- 本项目是双应用架构：`game-ad-system`（独立后端）和 `game-ad-desktop`（Electron桌面端）可独立运行
- CLAUDE.md 定义了多Agent协作协议，处理买量系统相关任务时必须激活5个专家Agent
- 所有Python代码需 >=3.11，使用 `ruff` 进行代码检查
- 前端使用 TypeScript strict mode，Zustand 管理状态
- 桌面应用通过 Electron ProcessManager 管理 ClickHouse/Redis/后端子进程

### Testing Requirements
- 后端：`cd game-ad-system && make test`（pytest，30+测试用例）
- 桌面后端：`cd game-ad-desktop/backend && pytest`
- 测试文件位于各模块的 `tests/` 子目录下

### Common Patterns
- 后端模块化架构：每个功能域（data/creative/execution/safety/memory）独立目录
- 前端页面在 `pages/`，对应 store 在 `stores/`，API 调用在 `services/`
- API路由按模块拆分在 `api/routes/` 下
- 配置通过 `.env` 文件管理，模板在 `.env.example`

### 启动命令速查
```bash
# 后端开发
cd game-ad-system && make dev          # Docker服务 + uvicorn热重载

# 前端开发（纯Web）
cd game-ad-desktop/frontend && npm run dev    # Vite开发服务器 :5173

# 桌面应用开发
cd game-ad-desktop/frontend && npm run electron:dev   # Vite + Electron

# 打包
cd game-ad-desktop && npm run package  # Windows安装程序 → release/
```

## Dependencies

### External
- **Meta Ads API** — 广告平台数据源（需 META_ACCESS_TOKEN）
- **AppsFlyer API** — 归因数据源
- **OpenAI API** — LLM推理（LangChain集成）
- **Docker** — ClickHouse/Redis/Airflow容器化（仅后端服务需要；桌面端内置管理）
- **Node.js >=18** — 前端和Electron构建

### Internal
- `game-ad-system` 和 `game-ad-desktop/backend` 共享相似的模块结构（data/creative/execution/safety/memory）
- 前端通过 `services/api.ts` 调用后端API（默认 localhost:8000）
- Zustand stores 之间目前独立，存在数据孤岛问题（详见 notepad 记录）

<!-- MANUAL: -->