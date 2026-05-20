# 游戏买量系统 · 多Agent工厂

游戏广告买量自动化系统，基于多Agent协作架构，覆盖数据采集、创意分析、投放执行、安全防护、记忆沉淀全链路。

## 项目结构

```
├── game-ad-system/        # 后端（Python + FastAPI）
│   ├── src/               # 核心业务模块
│   │   ├── data/          # 数据管道（异常检测/加载/合并 + AppsFlyer/Meta Ads适配器）
│   │   ├── creative/      # 创意分析（CLIP标签/Whisper转录/元素排名）
│   │   ├── execution/     # 执行引擎（Agent执行器 + 广告操作工具）
│   │   ├── safety/        # 安全防护（出价检查/预算检查/熔断器）
│   │   ├── memory/        # 记忆沉淀（存储/检索/摘要/DAG同步）
│   │   └── shared/        # 共享配置/数据库/模型
│   ├── api/               # FastAPI 路由
│   ├── tests/             # 单元测试（30+）
│   ├── dags/              # Airflow 数据管道
│   ├── infra/             # Docker 配置
│   ├── desktop/           # 内嵌 Vue Dashboard
│   ├── Makefile           # 常用命令
│   └── pyproject.toml     # Python 依赖
│
├── game-ad-desktop/       # 前端（React + Electron 桌面应用）
│   ├── frontend/          # React 前端
│   ├── backend/           # Python 后端（独立运行）
│   └── electron/          # Electron 主进程
│
├── docs/                  # 设计文档
└── CLAUDE.md              # 项目协作指令
```

## 环境要求

- Python >= 3.11
- Node.js >= 18
- Docker + Docker Compose（用于 ClickHouse、Redis、Airflow）

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/yehaohong02/game-ad-system.git
cd game-ad-system
```

### 2. 启动后端（game-ad-system）

```bash
cd game-ad-system

# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 安装依赖
pip install -e ".[dev]"

# 复制环境变量并配置
cp .env.example .env
# 编辑 .env 填入你的 API Key（Meta Ads、AppsFlyer、OpenAI 等）

# 启动基础设施（ClickHouse + Redis）
make dev

# 或者完整 Docker 启动
make up
```

后端启动后：
- API 服务：http://localhost:8000
- API 文档：http://localhost:8000/docs

### 3. 启动前端桌面应用（game-ad-desktop）

```bash
cd game-ad-desktop

# 安装前端依赖
cd frontend
npm install

# 开发模式启动
npm run dev

# 打包桌面应用
npm run electron:build
```

### 4. 运行测试

```bash
cd game-ad-system
make test

# 或带覆盖率
make test-cov
```

## 环境变量

复制 `.env.example` 为 `.env`，按需配置：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `APP_PORT` | 后端服务端口 | `8000` |
| `CLICKHOUSE_HOST` | ClickHouse 地址 | `localhost` |
| `REDIS_HOST` | Redis 地址 | `localhost` |
| `META_ACCESS_TOKEN` | Meta Ads API Token | - |
| `APPSFLYER_API_TOKEN` | AppsFlyer API Token | - |
| `OPENAI_API_KEY` | OpenAI API Key | - |
| `DAILY_BUDGET_LIMIT` | 日预算上限 | `10000.00` |
| `BID_INCREASE_MAX_RATIO` | 出价最大涨幅倍数 | `2.0` |

## 常用命令

```bash
# Docker
make up          # 启动所有服务
make down        # 停止所有服务
make logs        # 查看日志
make clean       # 清理所有容器和数据

# 开发
make dev         # 启动 ClickHouse + Redis + 开发服务器
make test        # 运行测试
make lint        # 代码检查
make format      # 代码格式化

# 数据库
make db-init     # 初始化 ClickHouse 数据库
make db-shell    # 进入 ClickHouse Shell
make redis-shell # 进入 Redis Shell
```

## License

MIT
