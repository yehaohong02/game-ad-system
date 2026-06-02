<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-25 | Updated: 2026-05-25 -->

# src — 核心业务模块

## Purpose
游戏买量系统的核心业务逻辑层，按功能域拆分为5个独立模块 + 1个共享层，对应多Agent协作架构。

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `data/` | 数据管道 — 异常检测(anomaly.py)、数据加载(loader.py)、合并(merger.py) + AppsFlyer/Meta Ads适配器 |
| `creative/` | 创意分析 — CLIP素材标签(clip_analyzer.py)、Whisper转录(whisper_transcriber.py)、元素排名(element_ranker.py) |
| `execution/` | 执行引擎 — Agent执行器(executor.py)、广告操作工具(update_bid/pause_ad/create_ad/get_ad_stats) + Meta Ads适配器 |
| `safety/` | 安全防护 — 出价检查(bid_check.py)、预算检查(budget_check.py)、熔断器(circuit_breaker.py) |
| `memory/` | 记忆沉淀 — 案例存储(store.py)、检索(retrieve.py)、摘要(summarizer.py)、DAG同步(dag_sync.py) |
| `shared/` | 共享层 — 配置(config.py)、ClickHouse连接(clickhouse.py)、Redis连接(redis_client.py)、Pydantic模型(ad.py) |

## For AI Agents

### Working In This Directory
- 每个模块有独立的 `__init__.py`，暴露公共接口
- schema定义在各自模块的 `schemas.py`（基于Pydantic v2）
- 数据适配器模式：`adapters/base.py` 定义抽象接口，具体平台实现继承
- 安全模块的所有检查在 `safety/guard.py` 中统一编排调用

### Testing Requirements
- 单元测试在 `tests/` 目录，模块结构对应 src/
- 使用 pytest-asyncio 处理异步测试
- 外部API调用需 mock（Meta Ads / AppsFlyer / OpenAI）

### Common Patterns
- 适配器模式：`data/adapters/` 和 `execution/adapters/` 使用 base.py → 平台实现
- 工具模式：`execution/tools/` 每个文件是一个独立广告操作工具
- 检查链模式：`safety/checks/` 各检查器独立，由 guard.py 串联

## Dependencies

### Internal
- `shared/config.py` — 所有模块的配置入口（pydantic-settings）
- `shared/db/` — 数据库连接（ClickHouse + Redis）
- `shared/models/` — 数据模型定义

### External
- clickhouse-connect — ClickHouse客户端
- redis — Redis客户端
- langchain / langchain-openai — AI Agent框架
- openai — LLM推理
- httpx — HTTP客户端（API调用）
- pandas — 数据处理

<!-- MANUAL: -->