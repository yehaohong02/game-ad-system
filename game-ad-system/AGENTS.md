<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-25 | Updated: 2026-05-25 -->

# game-ad-system — Python 后端服务

## Purpose
游戏买量系统的核心后端服务，基于 FastAPI 提供 RESTful API，集成 ClickHouse（数据存储）、Redis（缓存）、Airflow（任务编排）、LangChain/OpenAI（AI决策）。通过多Agent协作架构驱动广告投放全链路自动化。

## Key Files

| File | Description |
|------|-------------|
| `pyproject.toml` | Python项目配置，依赖定义（FastAPI/ClickHouse/Redis/LangChain等） |
| `Makefile` | 常用命令入口（make up/down/dev/test/lint） |
| `launcher.py` | PyInstaller打包用启动器，一键启动FastAPI+打开浏览器 |
| `.env.example` | 环境变量模板（API Keys/数据库连接/安全参数） |
| `游戏买量系统.spec` | PyInstaller打包规格文件 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | 核心业务模块（data/creative/execution/safety/memory/shared）（见 `src/AGENTS.md`） |
| `api/` | FastAPI 路由层，按模块拆分路由（见 `api/AGENTS.md`） |
| `tests/` | 单元测试（30+用例），pytest + pytest-asyncio |
| `dags/` | Airflow DAG 定义文件 |
| `infra/` | Docker 配置（docker-compose.yml + Dockerfile） |
| `desktop/` | 内嵌 Vue Dashboard（旧版前端，已被 game-ad-desktop 替代） |

## For AI Agents

### Working In This Directory
- Python >= 3.11，使用 `ruff` 格式化/检查代码
- 依赖管理用 `pip install -e ".[dev]"`
- 所有API路由前缀 `/api`，在 `api/routes/` 下按模块拆分
- 配置从 `.env` 文件加载（pydantic-settings）
- 数据存储在 ClickHouse，用 clickhouse-connect 连接

### Testing Requirements
```bash
make test        # pytest tests/ -v --tb=short
make test-cov    # 带覆盖率报告
```

### Common Patterns
- 每个业务模块（data/creative/execution/safety/memory）独立封装在 `src/` 下
- 模块接口通过 `src/shared/models/` 中的 Pydantic 模型定义
- 数据库操作通过 `src/shared/db/` 统一管理

### 开发启动
```bash
make dev         # 启动 ClickHouse + Redis（Docker）+ uvicorn :8000
make up          # 完整Docker部署（含Airflow）
```

## Dependencies

### Internal
- `src/shared/` — 所有模块共享的配置/数据库/模型
- `api/routes/` — 调用 `src/` 各模块的业务逻辑

### External
- ClickHouse — 时序广告数据存储
- Redis — 缓存和消息队列
- Apache Airflow — 数据管道调度
- LangChain + OpenAI — AI Agent推理
- Meta Ads API / AppsFlyer API — 广告平台数据源

<!-- MANUAL: -->