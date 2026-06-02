<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-25 | Updated: 2026-05-25 -->

# backend — 桌面端 Python 后端

## Purpose
Electron桌面应用内置的独立Python后端服务，提供与 `game-ad-system` 后端相似的API，但作为子进程运行。包含额外的 platform（竞品数据采集）和 reports（报表）模块。

## Key Files

| File | Description |
|------|-------------|
| `pyproject.toml` | Python项目配置，依赖 FastAPI/ClickHouse/Redis/ChromaDB/Celery/LangChain |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/ai/` | AI对话模块 — experts/ 子目录（多Agent专家） |
| `src/data/` | 数据管道 — adapters/（平台适配器）、etl/（数据转换） |
| `src/creative/` | 创意分析 — analyzer/（分析器）、tagger/（标签器） |
| `src/execution/` | 执行引擎 — agent/（Agent）、strategies/（策略）、tools/（工具） |
| `src/safety/` | 安全防护 — checks/（出价/预算/熔断检查） |
| `src/memory/` | 记忆沉淀 — 案例存储与检索 |
| `src/platform/` | 平台数据采集 — scrapers/（爬虫）、analyzers/（分析器） |
| `src/reports/` | 报表生成 — 日报/周报 |
| `src/shared/` | 共享层 — db/（数据库连接）、models/（数据模型） |
| `api/` | FastAPI路由 — routes/（按模块拆分） |
| `tasks/` | Celery 后台任务 |

## For AI Agents

### Working In This Directory
- 模块结构与 `game-ad-system` 后端镜像，但独立运行
- 桌面端特有模块：`platform/`（竞品数据采集）、`reports/`（报表）
- 使用 Celery + Redis 处理后台异步任务
- 作为 Electron 子进程启动，由 `electron/process-manager.ts` 管理

### 启动方式
```bash
# 直接启动（开发调试）
uvicorn api.main:app --reload --port 8000

# 通过Electron自动管理（生产）
cd frontend && npm run electron:dev
```

## Dependencies

### Internal
- 与 `electron/process-manager.ts` 通过进程管理交互
- 与前端通过 HTTP API（localhost:8000）通信

### External
- FastAPI + uvicorn — Web服务
- ClickHouse + Redis — 数据存储
- Celery — 异步任务队列
- ChromaDB — 向量数据库
- LangChain + OpenAI — AI推理

<!-- MANUAL: -->