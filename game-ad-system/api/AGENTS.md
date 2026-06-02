<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-25 | Updated: 2026-05-25 -->

# api — FastAPI 路由层

## Purpose
FastAPI 应用入口和路由定义。`main.py` 创建 FastAPI 实例、注册中间件和路由，`routes/` 下按功能模块拆分路由处理器。

## Key Files

| File | Description |
|------|-------------|
| `main.py` | FastAPI应用入口，CORS配置、路由注册、健康检查 |
| `__init__.py` | 包初始化 |
| `routes/data.py` | 数据诊断路由 — 广告表现数据、异常告警 |
| `routes/creative.py` | 创意洞察路由 — 素材排名、元素分析 |
| `routes/execution.py` | 执行闭环路由 — Agent运行、出价更新 |
| `routes/memory.py` | 记忆沉淀路由 — 相似案例检索 |
| `routes/platform.py` | 平台数据路由 — 竞品采集、页面分析、代理抓取 |
| `routes/manager.py` | 管理者模式路由 — 设计师列表/详情 |

## For AI Agents

### Working In This Directory
- 所有路由注册在 `main.py` 中，前缀 `/api`
- 每个路由文件依赖 `src/` 下对应模块的业务逻辑
- 请求/响应模型使用 Pydantic，定义在 `src/*/schemas.py`
- CORS 配置在 `main.py` 中，开发环境允许 localhost:5173

### API 端点总览
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/data/performance` | 广告表现数据 |
| GET | `/api/data/alerts` | 异常告警 |
| GET | `/api/creative/rankings` | 素材元素排名 |
| POST | `/api/execution/agent/run` | 运行Agent决策 |
| POST | `/api/execution/update-bid` | 更新出价 |
| POST | `/api/memory/similar` | 检索相似案例 |
| GET | `/api/platform/configs` | 平台配置 |
| POST | `/api/platform/analyze-page` | 分析页面 |
| POST | `/api/platform/scrape-proxy` | 代理抓取 |
| GET | `/api/manager/designers` | 设计师列表 |
| GET | `/health` | 健康检查 |

## Dependencies

### Internal
- `src/` 各模块 — 业务逻辑层
- `src/shared/config.py` — 应用配置

### External
- FastAPI — Web框架
- uvicorn — ASGI服务器（launcher.py 中启动）

<!-- MANUAL: -->