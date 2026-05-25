# 游戏买量系统 · 多Agent工厂

游戏广告买量自动化系统，基于多Agent协作架构，覆盖数据采集、创意分析、投放执行、安全防护、记忆沉淀全链路。

## 项目结构

```
game-ad-system/              # 后端服务（Python + FastAPI）
├── src/                     # 核心业务模块
│   ├── data/                # 数据管道（异常检测/加载/合并 + AppsFlyer/Meta Ads适配器）
│   ├── creative/            # 创意分析（CLIP标签/Whisper转录/元素排名）
│   ├── execution/           # 执行引擎（Agent执行器 + 广告操作工具）
│   ├── safety/              # 安全防护（出价检查/预算检查/熔断器）
│   ├── memory/              # 记忆沉淀（存储/检索/摘要/DAG同步）
│   └── shared/              # 共享配置/数据库/模型
├── api/                     # FastAPI 路由层
│   └── routes/              # 按模块拆分的路由（data/creative/execution/memory/platform/manager）
├── tests/                   # 单元测试（30+ 测试用例）
├── dags/                    # Airflow 数据管道 DAG
├── infra/                   # Docker 配置（docker-compose + Dockerfile）
├── desktop/                 # 内嵌 Vue Dashboard
├── launcher.py              # 应用启动器
├── Makefile                 # 常用命令
├── pyproject.toml           # Python 依赖定义
└── .env.example             # 环境变量模板

game-ad-desktop/             # 桌面应用（Electron + React）
├── frontend/                # React 前端
│   ├── src/
│   │   ├── components/      # 通用组件（Layout/Modal 等）
│   │   ├── pages/           # 页面组件
│   │   │   ├── Dashboard.tsx            # 数据总览
│   │   │   ├── DataDiagnosis.tsx        # 数据诊断
│   │   │   ├── CreativeInsightNew.tsx   # 创意洞察
│   │   │   ├── Execution.tsx            # 执行闭环
│   │   │   ├── Safety.tsx               # 安全防护
│   │   │   ├── Memory.tsx               # 记忆沉淀
│   │   │   ├── PlatformData.tsx         # 平台数据（含第三方爬虫）
│   │   │   ├── Workshop.tsx             # 工作坊
│   │   │   ├── Reports.tsx              # 报表中心
│   │   │   └── manager/                 # 管理者模式页面（7个）
│   │   ├── stores/          # Zustand 状态管理
│   │   ├── services/        # API 服务层
│   │   └── data/            # 本地数据文件（JSON）
│   ├── package.json         # 前端依赖
│   └── vite.config.ts       # Vite 配置
├── backend/                 # 桌面端 Python 后端（独立 FastAPI）
│   ├── src/
│   │   ├── ai/              # AI 对话模块
│   │   ├── data/            # 数据模块
│   │   ├── creative/        # 创意模块
│   │   ├── execution/       # 执行模块
│   │   ├── safety/          # 安全模块
│   │   ├── memory/          # 记忆模块
│   │   ├── platform/        # 平台数据 + 爬虫模块
│   │   ├── reports/         # 报表模块
│   │   └── shared/          # 共享配置
│   └── pyproject.toml       # 桌面后端依赖
├── electron/                # Electron 主进程
│   ├── main.ts              # 主进程入口（服务管理 + 窗口创建）
│   ├── preload.ts           # 预加载脚本
│   ├── process-manager.ts   # 子进程管理（ClickHouse/Redis/后端）
│   ├── tray.ts              # 系统托盘
│   ├── ipc-handlers.ts      # IPC 通信处理
│   └── crawler/             # 平台数据采集器
├── assets/                  # 应用图标资源
├── scripts/                 # 构建脚本
├── package.json             # Electron 依赖
├── electron-builder.yml     # 打包配置
└── tsconfig.json            # TypeScript 配置
```

## 环境要求

| 依赖 | 最低版本 | 用途 |
|------|---------|------|
| Python | >= 3.11 | 后端运行环境 |
| Node.js | >= 18 | 前端 + Electron |
| Docker + Docker Compose | 最新版 | ClickHouse / Redis / Airflow（仅后端服务需要） |

> **桌面应用用户**：Electron 版本已内置 ClickHouse 和 Redis 服务管理，无需单独安装 Docker。

---

## 快速开始

### 方式一：桌面应用（推荐）

桌面应用打包了前端界面 + Python 后端 + ClickHouse + Redis，一键启动。

```bash
# 1. 克隆仓库
git clone https://github.com/yehaohong02/game-ad-system.git
cd game-ad-system

# 2. 安装前端依赖
cd game-ad-desktop/frontend
npm install

# 3. 安装 Electron 依赖
cd ..
npm install

# 4. 构建 Python 后端（需要 Python >= 3.11）
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -e ".[dev]"
cd ..

# 5. 开发模式启动（前端热更新 + Electron）
cd frontend
npm run electron:dev

# 6. 打包为独立安装程序（Windows）
cd ..
npm run package
# 打包产物在 release/ 目录下
```

**桌面应用功能页面：**

| 模式 | 页面 | 说明 |
|------|------|------|
| 标准模式 | 数据总览 | 全局 KPI 看板、趋势图表 |
| | 数据诊断 | 广告数据异常检测、性能分析 |
| | 创意洞察 | 素材标签分析、元素效果排名 |
| | 执行闭环 | Agent 推理决策、广告操作 |
| | 安全防护 | 预算监控、熔断状态、操作审计 |
| | 记忆沉淀 | 历史案例检索、经验总结 |
| | 平台数据 | 第三方竞品数据采集与分析 |
| | 工作坊 | 创意工坊（开发中） |
| | 报表中心 | 日报/周报自动生成 |
| 管理者模式 | 管理者看板 | 团队整体数据概览 |
| | 数据诊断 | 设计师维度数据分析 |
| | 创意洞察 | 设计师素材表现对比 |
| | 执行闭环 | 团队执行状态管理 |
| | 安全防护 | 团队预算安全监控 |
| | 记忆沉淀 | 团队经验知识库 |
| | 报表中心 | 团队级报表管理 |

### 方式二：后端服务（独立部署）

适合服务端开发、API 调试和自定义集成。

```bash
# 1. 进入后端目录
cd game-ad-system

# 2. 创建并激活虚拟环境
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

# 3. 安装依赖
pip install -e ".[dev]"

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 API Key（Meta Ads、AppsFlyer、OpenAI 等）

# 5. 启动基础设施（ClickHouse + Redis）
make dev
# 此命令会：
# - 通过 Docker Compose 启动 ClickHouse 和 Redis
# - 启动 uvicorn 开发服务器（端口 8000，热重载）
```

后端启动后访问：
- **API 服务**：http://localhost:8000
- **API 文档**：http://localhost:8000/docs（Swagger UI）
- **健康检查**：http://localhost:8000/health

#### 完整 Docker 部署（含 Airflow）

```bash
cd game-ad-system

# 启动所有服务（FastAPI + ClickHouse + Redis + Airflow）
make up

# 查看日志
make logs

# 停止所有服务
make down

# 清理所有容器和数据卷
make clean
```

Airflow 管理面板：http://localhost:8080（默认用户名/密码：admin/admin）

### 运行前端开发服务器（不启动 Electron）

```bash
cd game-ad-desktop/frontend
npm install
npm run dev
# 访问 http://localhost:5173
```

> 注意：前端通过 API 调用后端服务（默认 http://localhost:8000），请确保后端已启动。

---

## 环境变量

复制 `.env.example` 为 `.env`，按需配置：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `APP_PORT` | 后端服务端口 | `8000` |
| **ClickHouse** | | |
| `CLICKHOUSE_HOST` | ClickHouse 地址 | `localhost` |
| `CLICKHOUSE_HTTP_PORT` | ClickHouse HTTP 端口 | `8123` |
| `CLICKHOUSE_TCP_PORT` | ClickHouse TCP 端口 | `9000` |
| `CLICKHOUSE_USER` | ClickHouse 用户名 | `default` |
| `CLICKHOUSE_PASSWORD` | ClickHouse 密码 | _(空)_ |
| `CLICKHOUSE_DB` | ClickHouse 数据库名 | `game_ads` |
| **Redis** | | |
| `REDIS_HOST` | Redis 地址 | `localhost` |
| `REDIS_PORT` | Redis 端口 | `6379` |
| `REDIS_PASSWORD` | Redis 密码 | _(空)_ |
| `REDIS_DB` | Redis 数据库编号 | `0` |
| **Meta Ads API** | | |
| `META_ACCESS_TOKEN` | Meta Ads API Token | _(必填)_ |
| `META_AD_ACCOUNT_ID` | 广告账户 ID | _(必填)_ |
| `META_APP_ID` | Meta App ID | _(必填)_ |
| `META_APP_SECRET` | Meta App Secret | _(必填)_ |
| **AppsFlyer API** | | |
| `APPSFLYER_API_TOKEN` | AppsFlyer API Token | _(必填)_ |
| `APPSFLYER_APP_ID` | AppsFlyer App ID | _(必填)_ |
| **OpenAI API** | | |
| `OPENAI_API_KEY` | OpenAI API Key | _(必填)_ |
| **安全配置** | | |
| `DAILY_BUDGET_LIMIT` | 日预算上限（USD） | `10000.00` |
| `BID_INCREASE_MAX_RATIO` | 出价最大涨幅倍数 | `2.0` |
| **Airflow** | | |
| `AIRFLOW_PORT` | Airflow Web 端口 | `8080` |
| `AIRFLOW_USER` | Airflow 管理员用户名 | `admin` |
| `AIRFLOW_PASSWORD` | Airflow 管理员密码 | `admin` |
| `AIRFLOW_EMAIL` | 管理员邮箱 | `admin@example.com` |
| `AIRFLOW_SECRET_KEY` | Airflow 密钥 | _(生产环境请修改)_ |

---

## 常用命令

### 后端服务（game-ad-system）

```bash
# Docker
make up          # 启动所有服务（FastAPI + ClickHouse + Redis + Airflow）
make down        # 停止所有服务
make logs        # 查看日志
make clean       # 清理所有容器和数据
make dev         # 启动 ClickHouse + Redis + 开发服务器（热重载）

# 测试
make test        # 运行所有测试
make test-cov    # 运行测试 + 生成覆盖率报告

# 代码质量
make lint        # 代码检查（ruff）
make lint-fix    # 自动修复代码问题
make format      # 代码格式化

# 数据库
make db-init     # 初始化 ClickHouse 数据库
make db-shell    # 进入 ClickHouse Shell
make redis-shell # 进入 Redis Shell

# Airflow
make airflow-shell  # 进入 Airflow Shell
make airflow-dags   # 列出所有 DAG
```

### 桌面应用（game-ad-desktop）

```bash
# 前端开发
cd frontend
npm run dev           # 仅启动 Vite 开发服务器
npm run build         # 构建前端生产包
npm run electron:dev  # 启动 Electron 开发模式（前端 + 桌面壳）
npm run electron:build  # 构建并打包 Electron 应用

# 打包
cd ..
npm run package       # 打包为 Windows 安装程序（产物在 release/）
```

---

## API 概览

所有 API 前缀：`/api`

| 模块 | 端点 | 说明 |
|------|------|------|
| 数据诊断 | `GET /data/performance` | 获取广告表现数据 |
| | `GET /data/alerts` | 获取异常告警 |
| 创意洞察 | `GET /creative/rankings` | 获取素材元素排名 |
| 执行闭环 | `POST /execution/agent/run` | 运行 Agent 决策 |
| | `POST /execution/update-bid` | 更新广告出价 |
| 记忆沉淀 | `POST /memory/similar` | 检索相似历史案例 |
| 平台数据 | `GET /platform/configs` | 获取平台配置 |
| | `POST /platform/analyze-page` | 分析抓取页面 |
| | `POST /platform/scrape-proxy` | 代理抓取 |
| | `GET /platform/creatives` | 获取竞品素材 |
| | `GET /platform/rankings` | 获取竞品排行 |
| 管理者 | `GET /manager/designers` | 获取设计师列表 |
| | `GET /manager/designers/{name}` | 获取设计师详情 |
| 报表 | `GET /reports/daily` | 获取日报 |
| | `GET /reports/weekly` | 获取周报 |
| AI | `POST /ai/chat` | AI 对话 |
| 系统 | `GET /health` | 健康检查 |

启动后端后访问 http://localhost:8000/docs 查看完整交互式 API 文档。

---

## 多Agent协作架构

本系统采用五大专家 Agent 协同工作：

| Agent | 职责 | 核心能力 |
|-------|------|---------|
| 🧠 **DATA** | 数据诊断 | 数据管道、异常检测、指标计算 |
| 🎨 **CREATIVE** | 创意洞察 | 素材标签、表现分析、创意优化建议 |
| ⚡ **EXECUTION** | 执行闭环 | 广告平台 API 调用、出价调整、A/B 测试 |
| 🛡️ **SAFETY** | 安全防护 | 预算锁、熔断器、操作校验 |
| 💾 **MEMORY** | 记忆沉淀 | 历史案例存储、检索、经验总结 |

**协作流程**：数据 → 洞察 → 执行 → 安全 → 记忆

---

## 常见问题

### Q: 后端启动报错 `Connection refused`？
确保 ClickHouse 和 Redis 已通过 Docker 启动：
```bash
cd game-ad-system
make dev
```

### Q: 桌面应用 Electron 开发模式白屏？
确保后端 Python 服务已启动（默认 http://localhost:8000），或等待 Electron 内置的 ProcessManager 自动拉起服务。

### Q: `pip install` 报错？
确认 Python 版本 >= 3.11：
```bash
python --version
```
如果版本过低，请从 https://www.python.org/downloads/ 下载最新版。

### Q: `npm install` 很慢？
可以配置 npm 镜像：
```bash
npm config set registry https://registry.npmmirror.com
```

### Q: Docker 启动失败？
确保 Docker Desktop 已安装并运行。Windows 用户需要开启 WSL2。

---

## License

MIT
