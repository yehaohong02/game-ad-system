# Cheat-on-Content × 游戏买量系统：对比分析与改进方案

> 文档生成时间：2026-06-02
> 目标：深入分析两个产品的特性，提炼可借鉴的创新点，设计具体改进方案

---

## 目录

- [第一部分：产品一 — Cheat-on-Content](#第一部分产品一--cheat-on-content)
- [第二部分：产品二 — 游戏买量系统](#第二部分产品二--游戏买量系统)
- [第三部分：对比分析](#第三部分对比分析)
- [第四部分：改进方案](#第四部分改进方案)
- [第五部分：实施路线图](#第五部分实施路线图)

---

# 第一部分：产品一 — Cheat-on-Content

## 1.1 项目概述

| 项目 | 详情 |
|------|------|
| **仓库地址** | [github.com/XBuilderLAB/cheat-on-content](https://github.com/XBuilderLAB/cheat-on-content) |
| **定位** | 面向内容创作者的 AI 辅助技能工具 |
| **核心理念** | 将每一次内容发布从"凭感觉赌博"转变为"可量化校准的实验" |
| **开源协议** | MIT |
| **当前版本** | v0.1.0 |
| **口号** | "Cheat on Content" — 通过系统化方法建立属于自己的爆款公式 |

## 1.2 核心功能

### 1.2.1 五步闭环工作流

Cheat-on-Content 的核心是建立了一个**预测-复盘闭环**：

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   📊 评分 (Score)                                           │
│      ↓                                                      │
│   🎯 盲预测 (Blind Predict)                                 │
│      ↓                                                      │
│   🚀 发布 (Publish)                                         │
│      ↓                                                      │
│   📈 T+3天复盘 (T+3d Retro)                                 │
│      ↓                                                      │
│   🧬 进化评分标准 (Evolve Rubric)                            │
│      ↓                                                      │
│   └──────────── 回到评分，形成闭环 ─────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**每一步的详细说明：**

| 步骤 | 功能 | 输入 | 输出 |
|------|------|------|------|
| **评分** | 对内容进行量化打分 | 内容素材 | 多维度评分（0-10） |
| **盲预测** | 在发布前写下对流量的预测 | 评分结果（不看历史数据） | 预测的播放量/互动区间 |
| **发布** | 正式发布内容 | — | 发布时间标记 |
| **T+3复盘** | 三天后用真实数据与预测对照 | 实际数据 + 预测数据 | 误差分析报告 |
| **进化公式** | 根据复盘结果更新评分公式 | 误差分析 | 新版评分公式 |

### 1.2.2 自动进化的评分体系

**核心特点：**
- 评分公式**从创作者自身历史数据中反向推导**，而非使用通用标准
- 连续三次同方向预测失误时，工具主动提示升级评分公式
- 升级前需重新对所有历史样本评分
- 新旧公式排名准确率对比，**胜出才可生效**
- 跨模型独立审计机制防止自欺欺人

**进化触发条件：**
```
连续3次预测偏差方向相同（如都高估或都低估）
  → 触发公式进化审查
    → 重新评估所有历史样本
      → 新旧公式准确率对比
        → 胜出则替换，失败则保留旧公式
```

### 1.2.3 盲预测隔离机制

**设计目的：** 保证预测环节不会泄露实际数据，确保预测的客观性

**实现方式：**
- 使用"盲子代理"（blind sub-agent）执行预测
- 预测时只能访问内容特征（标题、封面、时长等）
- **不能访问**历史播放量、互动率等实际数据
- v1.3 → v1.4 的迁移专门强化了此隔离（拆分 `rubric_notes.md` 文件）

### 1.2.4 14 个子技能模块

安装后通过符号链接注入到代理技能目录：

| 模块 | 功能 |
|------|------|
| 评分模块 | 对内容进行多维度量化打分 |
| 预测模块 | 盲预测流量表现 |
| 复盘模块 | T+3天数据对比分析 |
| 进化模块 | 评分公式自动升级 |
| 趋势抓取 | 获取当前平台热门趋势 |
| 话题发现 | 识别高潜力话题 |
| 基准账号对比 | 与标杆账号进行对比分析 |
| 决策日志 | 记录每次预测的决策依据 |
| ... | 其他辅助模块 |

### 1.2.5 与通用 LLM 的关键区别

| 维度 | ChatGPT/DeepSeek/豆包 | Cheat-on-Content |
|------|----------------------|------------------|
| **建议来源** | 全局平均观点 | 仅从你的频道历史数据推导 |
| **个性化程度** | 所有人相同的建议 | 只属于你的评分标准 |
| **学习机制** | 静态知识 | 每次发布更新模型认知 |
| **精度提升** | 无 | 三个月后判断精度提升10倍 |
| **记忆能力** | 无长期记忆 | 记住基准账号、发布节奏、失败原因 |

### 1.2.6 评分标准是"工作台"而非"博物馆"

**核心原则：** 只保留当前最有用的内容

- 被数据推翻的观察 → **删除**
- 已被吸收为正式维度的观察 → **删除**
- 持续迭代，避免评分体系臃肿

## 1.3 技术架构

| 层面 | 技术/工具 |
|------|----------|
| 代码托管 | GitHub |
| 安装方式 | Shell 脚本（`install.sh` / `uninstall.sh`） |
| AI 代理支持 | Claude Code（默认）、Codex、或两者兼有 |
| 技能分发 | 符号链接（symlink）注入代理技能目录 |
| 数据格式 | Markdown 文件（评分笔记、复盘记录等） |
| 迁移机制 | 版本化迁移脚本（如 `migrations/1.3-to-1.4.md`） |
| 子技能数量 | 14 个，各司其职 |
| 安装模式 | `--copy`（冻结版本）或默认 symlink 模式 |

## 1.4 使用场景与命令

### 日常工作流命令

| 命令 | 功能 |
|------|------|
| `score` | 仅对脚本/内容评分 |
| `start prediction` | 启动盲预测并记录决策日志 |
| `shot` | 创建视频文件夹并增加缓冲计数 |
| `shipped` | 发布后减少缓冲计数 |
| `retro` | 三天后执行复盘 |
| `status` | 查看当前状态 |
| `fetch trends` | 获取趋势数据 |
| `find topic` | 发现高潜话题 |
| `bump rubric` | 触发公式进化 |
| `find benchmark` | 寻找基准账号 |

### 适用人群

1. **短视频/社交媒体创作者**：需要从"感觉能爆"进化为"数据验证后能爆"
2. **高频内容发布者**：发布200条内容后仍比新手只强10%，因为缺少系统复盘
3. **希望建立个人方法论的创作者**：不想依赖通用AI的平均建议
4. **团队化内容运营**：需要可追溯、可审计的决策链路

## 1.5 项目哲学

> **核心竞争力不是AI生成内容，而是让AI评判创作者自己的内容，并通过持续数据积累实现判断力的复利增长。**

---

# 第二部分：产品二 — 游戏买量系统

## 2.1 项目概述

| 项目 | 详情 |
|------|------|
| **项目名称** | 游戏买量系统 · 多Agent工厂 |
| **定位** | 游戏广告买量自动化系统 |
| **架构** | 双应用并行（独立后端 + Electron桌面应用） |
| **核心理念** | 五Agent协作（数据→洞察→执行→安全→记忆） |
| **技术栈** | Python/FastAPI + React/TypeScript + Electron |

## 2.2 系统架构

### 2.2.1 顶层目录结构

```
D:\CC\
├── game-ad-system/          # 独立后端服务 (Python + FastAPI)
├── game-ad-desktop/         # Electron 桌面应用 (前端 + 后端 + Electron壳)
├── docs/                    # 项目文档
├── scripts/                 # 构建和工具脚本
├── 数据/                     # 数据文件存储
├── releases/                # 发布产物
├── AGENTS.md                # 多Agent协作协议
├── CLAUDE.md                # AI Agent 行为规范
└── README.md                # 完整项目文档
```

### 2.2.2 五Agent协作架构

| Agent | 职责 | 对应后端模块 |
|-------|------|-------------|
| 🧠 **DATA** (数据诊断) | 数据管道、异常检测、指标计算 | `src/data/` |
| 🎨 **CREATIVE** (创意洞察) | 素材标签、表现分析、创意优化建议 | `src/creative/` |
| ⚡ **EXECUTION** (执行闭环) | 广告平台API调用、出价调整、A/B测试 | `src/execution/` |
| 🛡️ **SAFETY** (安全防护) | 预算锁、熔断器、操作校验 | `src/safety/` |
| 💾 **MEMORY** (记忆沉淀) | 历史案例存储、检索、经验总结 | `src/memory/` |

**协作链路：** 数据 → 洞察 → 执行 → 安全 → 记忆

## 2.3 前端技术栈与页面

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React + TypeScript | 18.2+ / 5.3+ | UI 框架 |
| Vite | 5.1+ | 构建工具 |
| Ant Design (antd) | 5.15+ | UI 组件库 |
| ECharts | 5.6+ | 图表可视化 |
| Zustand | 4.5+ | 状态管理 |
| React Router | — | 路由（HashRouter） |
| Axios | — | HTTP 请求 |

### 页面结构

#### 标准模式页面（9个）

| 页面 | 路由 | 功能 |
|------|------|------|
| Dashboard | `/` | 数据总览 |
| DataDiagnosis | `/data` | 数据诊断 |
| CreativeInsightNew | `/creative` | 创意洞察（核心页面） |
| Execution | `/execution` | 执行闭环 |
| Safety | `/safety` | 安全防护 |
| Memory | `/memory` | 记忆沉淀 |
| PlatformData | `/platform` | 平台数据（含竞品爬虫） |
| Workshop | `/workshop` | 工作坊（创意公式） |
| Reports | `/reports` | 报表中心 |

#### 管理者模式页面（7个）

| 页面 | 路由 | 功能 |
|------|------|------|
| ManagerDashboard | `/manager` | 团队KPI看板 |
| ManagerDataDiagnosis | `/manager/data` | 团队体检报告 |
| ManagerCreativeInsight | `/manager/creative` | 设计师素材对比 |
| ManagerExecution | `/manager/execution` | 执行闭环 |
| ManagerSafety | `/manager/safety` | 安全防护 |
| ManagerMemory | `/manager/memory` | 记忆沉淀 |
| ManagerReports | `/manager/reports` | 报表中心 |

### 主题系统

| 主题 | 文件 | 风格 |
|------|------|------|
| Candy（糖果色） | `tokens/candy.css` | 活泼、多彩 |
| Tech（科技蓝） | `tokens/tech.css` | 专业、深色 |

## 2.4 后端核心功能模块

### 2.4.1 数据模块 (`src/data/`)

| 文件 | 功能 |
|------|------|
| `anomaly.py` | 异常检测算法 |
| `loader.py` | 数据加载器 |
| `merger.py` | 多源数据合并 |
| `adapters/base.py` | 适配器基类 |
| `adapters/meta_ads.py` | Meta Ads API 适配器 |
| `adapters/appsflyer.py` | AppsFlyer API 适配器 |

### 2.4.2 创意分析模块 (`src/creative/`)

#### 视频素材自动打标流水线

```
CSV输入 → CLIP视觉分析 → Whisper音频转录 → JSON标签输出
```

**视觉标签（10个预定义场景）：**

| 标签 | 描述 |
|------|------|
| 真人讲解 | 真人出镜讲解 |
| 战斗画面 | 游戏战斗场景 |
| 宝箱奖励 | 开箱/奖励展示 |
| 快节奏剪辑 | 快速切换画面 |
| 角色展示 | 角色技能展示 |
| 新手教程 | 教学引导画面 |
| 社交互动 | 多人互动场景 |
| 剧情对话 | 故事情节展示 |
| UI界面操作 | 游戏界面操作 |
| CG动画 | 过场动画展示 |

#### 元素效果排名引擎

**逻辑：**
1. 按标签组合聚合素材
2. 计算每种标签组合的平均 ROAS/CTR/IPM
3. 过滤样本量 < 3 的组合
4. 按 ROAS 降序排列

#### 创意推荐引擎

使用 **LangChain + GPT-4o-mini** 基于 Top 元素数据生成创意简报：
- 推荐素材类型和时长
- 建议包含的视觉元素
- 推荐文案关键词
- 预期效果

### 2.4.3 执行引擎 (`src/execution/`)

| 文件 | 功能 |
|------|------|
| `agent/executor.py` | Agent执行器 |
| `agent/prompts.py` | LLM提示词 |
| `adapters/meta_ads.py` | Meta Ads 执行适配器 |
| `tools/create_ad.py` | 创建广告 |
| `tools/update_bid.py` | 更新出价 |
| `tools/pause_ad.py` | 暂停广告 |
| `tools/get_ad_stats.py` | 获取广告统计 |

### 2.4.4 安全防护 (`src/safety/`)

| 文件 | 功能 |
|------|------|
| `guard.py` | 安全守卫（统一入口） |
| `exceptions.py` | 自定义异常 |
| `checks/bid_check.py` | 出价范围检查 |
| `checks/budget_check.py` | 预算超限检查 |
| `checks/circuit_breaker.py` | 熔断器（连续失败自动停止） |

### 2.4.5 记忆沉淀 (`src/memory/`)

| 文件 | 功能 |
|------|------|
| `store.py` | 案例存储 |
| `retrieve.py` | 向量检索（ChromaDB） |
| `summarizer.py` | 摘要生成 |
| `dag_sync.py` | Airflow DAG同步 |

## 2.5 AI Agent 协调系统

### Commander（总指挥）

```python
class Commander:
    def dispatch(module, data, action)  # 调用单个专家
    def full_scan(all_data)             # 全量扫描所有专家
```

### 7个专家 Agent

| 专家 | 文件 | 职责 |
|------|------|------|
| DataExpert | `data_expert.py` | 数据诊断分析 |
| CreativeExpert | `creative_expert.py` | 创意洞察分析 |
| ExecutionExpert | `execution_expert.py` | 执行策略建议 |
| SafetyExpert | `safety_expert.py` | 安全风险评估 |
| MemoryExpert | `memory_expert.py` | 历史案例检索 |
| PlatformExpert | `platform_expert.py` | 平台数据分析 |
| PageAnalyzer | `page_analyzer.py` | 网页结构分析（AI推荐CSS选择器） |

## 2.6 平台数据爬虫系统

### CrawlerManager 能力

| 功能 | 描述 |
|------|------|
| 平台窗口管理 | 打开/关闭/导航 |
| Cookie 持久化 | 自动保存和恢复登录状态 |
| 自动登录 | 表单填写 + 提交 |
| HTML 提取 | 执行 CSS 选择器提取数据 |
| 下载按钮检测 | 关键词匹配：导出/下载/Export/Download/Excel/CSV |
| 全站自动扫描 | BFS 遍历页面，自动发现下载入口 |
| 文件下载管理 | xlsx/xls/csv，120秒超时 |

## 2.7 报表自动生成

从 ClickHouse 查询数据，自动生成日报和周报：

- 核心指标：总花费、总安装、平均ROAS、平均CPI、平均CTR
- 异常告警摘要：总数 + critical 数
- Top 5 素材：按 ROAS 排序

## 2.8 外部依赖与集成

| 服务 | 用途 |
|------|------|
| Meta Ads API | 广告投放与数据回传 |
| AppsFlyer API | 归因数据 |
| OpenAI API (GPT-4o-mini) | LLM 推理 |
| ClickHouse | 广告表现数据存储 |
| Redis | 缓存层 |
| ChromaDB | 向量数据库（历史案例语义检索） |
| Airflow | 数据管道调度 |
| Docker | 基础设施容器化 |

---

# 第三部分：对比分析

## 3.1 定位对比

| 维度 | Cheat-on-Content | 游戏买量系统 |
|------|------------------|-------------|
| **目标用户** | 内容创作者（短视频/社交媒体） | 游戏广告投放团队 |
| **核心场景** | 内容创作 → 发布 → 复盘 | 素材分析 → 投放 → 优化 |
| **交互方式** | CLI 命令 + AI Agent 对话 | Electron 桌面应用 + API |
| **数据来源** | 平台公开数据（播放量、点赞等） | 广告平台API（花费、ROAS等） |

## 3.2 核心能力对比

| 能力维度 | Cheat-on-Content | 游戏买量系统 |
|---------|------------------|-------------|
| **内容分析** | 人工定义评分维度 | CLIP自动打标 + Whisper音频转录 |
| **预测能力** | 盲预测 + 自动进化 | ❌ 无显式预测功能 |
| **复盘机制** | T+3天自动复盘 | 有报表但无预测-实际对比 |
| **公式进化** | 自动进化（数据驱动） | 固定公式（人工定义） |
| **个性化** | 仅从"你的数据"推导 | 基于全量数据聚合 |
| **执行能力** | ❌ 无（纯分析工具） | ✅ 完整（API调用、出价调整） |
| **安全防护** | ❌ 无 | ✅ 完整（预算锁、熔断器） |
| **记忆系统** | Markdown文件 | ChromaDB向量检索 |
| **团队协作** | 个人工具 | 管理者模式 + 团队看板 |

## 3.3 工作流对比

### Cheat-on-Content 工作流

```
内容创作 → 评分 → 盲预测 → 发布 → T+3复盘 → 进化公式 → 内容创作...
   └─────────────────────── 闭环 ───────────────────────┘
```

### 游戏买量系统工作流

```
素材上传 → CLIP打标 → 元素排名 → 创意简报 → [人工决策] → 投放 → 报表
                                                              ↓
                                                         无自动复盘
                                                              ↓
                                                         无公式进化
```

## 3.4 SWOT 分析

### Cheat-on-Content

| | 正面 | 负面 |
|---|------|------|
| **内部** | ✅ 闭环复利机制独特<br>✅ 盲预测保证客观性<br>✅ 公式自动进化 | ❌ 无执行能力<br>❌ 无安全防护<br>❌ 仅支持个人使用 |
| **外部** | ✅ 填补内容创作工具空白<br>✅ 低门槛易上手 | ❌ 依赖AI Agent稳定性<br>❌ 需要长期数据积累 |

### 游戏买量系统

| | 正面 | 负面 |
|---|------|------|
| **内部** | ✅ CLIP打标技术领先<br>✅ 完整执行+安全链路<br>✅ 团队协作支持 | ❌ 缺少预测-复盘闭环<br>❌ 公式固定不进化<br>❌ 个性化程度不足 |
| **外部** | ✅ 游戏买量市场需求大<br>✅ 竞品多为纯工具 | ❌ 广告平台API限制<br>❌ 数据获取成本高 |

## 3.5 可借鉴的核心创新点

### 创新点一：预测-复盘闭环（最大启发）

**Cheat-on-Content 的做法：**
- 发布前盲预测 → 发布后 T+3 复盘 → 误差驱动公式进化

**你的系统现状：**
- 素材打标 → 元素排名 → 创意简报 → ...就停了
- 有报表但没有"预测 vs 实际"的对比
- 公式不会根据投放结果自动调整

**借鉴价值：** ⭐⭐⭐⭐⭐（最高）

### 创新点二：公式自动进化

**Cheat-on-Content 的做法：**
- 评分公式从历史数据反向推导
- 连续3次预测失误触发进化
- 新旧公式对比，胜出才生效

**你的系统现状：**
- 7个固定爆款公式（f1-f7），人工定义
- 不会根据投放数据自动调整权重
- 公式命中率无法量化

**借鉴价值：** ⭐⭐⭐⭐⭐（最高）

### 创新点三：盲预测隔离

**Cheat-on-Content 的做法：**
- 预测时使用"盲子代理"
- 只看内容特征，不看实际数据
- 保证预测的客观性

**你的系统现状：**
- 生成创意简报时直接访问所有历史数据
- 无法区分"预测"和"分析"

**借鉴价值：** ⭐⭐⭐⭐（高）

### 创新点四：个人评分体系

**Cheat-on-Content 的做法：**
- 评分标准从"你的频道"数据推导
- 不使用通用标准
- 每次发布更新模型认知

**你的系统现状：**
- 使用通用的10个视觉标签
- 元素排名基于全量数据聚合
- 无法体现单个账户的特殊性

**借鉴价值：** ⭐⭐⭐⭐（高）

### 创新点五：基准账号对比

**Cheat-on-Content 的做法：**
- 导入基准账号（5-10个样本）
- 与自身表现对比
- 识别差距和改进方向

**你的系统现状：**
- 有竞品爬虫功能
- 但缺少系统化的对比分析

**借鉴价值：** ⭐⭐⭐（中）

---

# 第四部分：改进方案

## 4.1 方案总览

| 方案 | 名称 | 优先级 | 工作量 | 价值 | 涉及模块 |
|------|------|--------|--------|------|---------|
| **方案一** | 预测-复盘闭环系统 | P0 | 中 | ⭐⭐⭐⭐⭐ | 🎨CREATIVE + 💾MEMORY |
| **方案二** | 爆款公式自动进化 | P0 | 中 | ⭐⭐⭐⭐⭐ | 🧠DATA + 🎨CREATIVE |
| **方案三** | 盲预测隔离机制 | P1 | 小 | ⭐⭐⭐⭐ | ⚡EXECUTION + 🛡️SAFETY |
| **方案四** | 个人评分体系 | P1 | 大 | ⭐⭐⭐⭐ | 🎨CREATIVE + 🧠DATA |
| **方案五** | 跨账户基准对比 | P2 | 中 | ⭐⭐⭐ | 💾MEMORY + 🧠DATA |

## 4.2 方案一：预测-复盘闭环系统（P0）

### 4.2.1 设计理念

借鉴 Cheat-on-Content 的核心五步闭环，为每次素材投放建立"预测→验证→进化"的完整循环。

### 4.2.2 流程设计

```
现有流程：
素材打标 → 元素排名 → 创意简报 → [结束]

新增闭环：
素材打标 → 元素排名 → 创意简报 → 预测打分 → 发布标记 → T+3自动复盘 → 公式进化
                                                          ↑              ↓
                                                          └──── 反馈 ────┘
```

### 4.2.3 后端新增模块

#### `src/creative/predictor.py` — 预测引擎

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class Prediction:
    """投放预测结果"""
    creative_id: str
    predicted_ctr: tuple[float, float]      # (下限, 上限)
    predicted_cvr: tuple[float, float]
    predicted_roas: tuple[float, float]
    confidence: float                        # 置信度 0-1
    evidence: list[str]                      # 预测依据
    created_at: str

class CreativePredictor:
    """素材表现预测器"""

    def predict(self, creative_features: dict, historical_data: list) -> Prediction:
        """
        基于素材特征和历史数据，预测投放表现

        Args:
            creative_features: 素材特征（标签、时长、风格等）
            historical_data: 历史投放数据

        Returns:
            Prediction: 预测结果
        """
        # 1. 提取相似历史素材
        similar_creatives = self._find_similar(creative_features, historical_data)

        # 2. 计算统计区间
        ctr_stats = self._calc_percentile([c['ctr'] for c in similar_creatives])
        roas_stats = self._calc_percentile([c['roas'] for c in similar_creatives])

        # 3. 计算置信度（基于样本量）
        confidence = min(len(similar_creatives) / 20, 1.0)

        return Prediction(
            creative_id=creative_features['id'],
            predicted_ctr=(ctr_stats['p25'], ctr_stats['p75']),
            predicted_cvr=...,
            predicted_roas=(roas_stats['p25'], roas_stats['p75']),
            confidence=confidence,
            evidence=self._generate_evidence(similar_creatives),
            created_at=datetime.now().isoformat()
        )

    def _find_similar(self, features: dict, history: list) -> list:
        """基于标签相似度找历史素材"""
        ...

    def _calc_percentile(self, values: list) -> dict:
        """计算百分位数"""
        ...
```

#### `src/creative/retro.py` — 复盘引擎

```python
@dataclass
class RetroResult:
    """复盘结果"""
    prediction_id: str
    creative_id: str
    predicted: Prediction
    actual: ActualData
    ctr_error: float          # CTR预测误差（百分比）
    roas_error: float         # ROAS预测误差
    direction: str            # 'over' | 'under' | 'accurate'
    insights: list[str]       # 复盘洞察

class RetroEngine:
    """复盘引擎"""

    def review(self, prediction: Prediction, actual: ActualData) -> RetroResult:
        """
        对比预测与实际，生成复盘报告

        Args:
            prediction: 发布前的预测
            actual: T+3天后的实际数据

        Returns:
            RetroResult: 复盘结果
        """
        ctr_error = abs(prediction.predicted_ctr[1] - actual.ctr) / actual.ctr
        roas_error = abs(prediction.predicted_roas[1] - actual.roas) / actual.roas

        if ctr_error < 0.1:
            direction = 'accurate'
        elif actual.ctr > prediction.predicted_ctr[1]:
            direction = 'under'  # 低估了
        else:
            direction = 'over'   # 高估了

        return RetroResult(
            prediction_id=prediction.id,
            creative_id=actual.creative_id,
            predicted=prediction,
            actual=actual,
            ctr_error=ctr_error,
            roas_error=roas_error,
            direction=direction,
            insights=self._generate_insights(prediction, actual)
        )

    def batch_review(self, predictions: list, actuals: list) -> list[RetroResult]:
        """批量复盘"""
        ...

    def check_evolution_trigger(self, recent_retros: list[RetroResult]) -> bool:
        """
        检查是否触发公式进化

        触发条件：连续3次预测偏差方向相同
        """
        if len(recent_retros) < 3:
            return False

        last_3 = recent_retros[-3:]
        directions = [r.direction for r in last_3]

        # 连续3次都高估或都低估
        return len(set(directions)) == 1 and directions[0] != 'accurate'
```

#### `src/creative/evolver.py` — 公式进化器

```python
class FormulaEvolver:
    """爆款公式进化器"""

    def evolve(self, formula: dict, retro_results: list[RetroResult]) -> dict:
        """
        根据复盘结果进化公式

        Args:
            formula: 当前公式（如 f1: 末世建造）
            retro_results: 相关复盘结果

        Returns:
            dict: 进化后的公式
        """
        # 1. 分析误差模式
        error_pattern = self._analyze_error_pattern(retro_results)

        # 2. 调整公式权重
        new_weights = self._adjust_weights(formula['weights'], error_pattern)

        # 3. 生成候选新公式
        candidate = {
            **formula,
            'weights': new_weights,
            'version': formula['version'] + 1,
            'last_evolved': datetime.now().isoformat(),
        }

        # 4. 新旧公式对比验证
        old_score = self._evaluate(formula, retro_results)
        new_score = self._evaluate(candidate, retro_results)

        if new_score > old_score:
            return candidate  # 新公式胜出
        else:
            return formula    # 保留旧公式

    def _analyze_error_pattern(self, retros: list) -> dict:
        """分析误差模式：哪些标签组合预测偏差大"""
        ...

    def _adjust_weights(self, weights: dict, pattern: dict) -> dict:
        """调整标签权重"""
        ...

    def _evaluate(self, formula: dict, retros: list) -> float:
        """评估公式准确率"""
        ...
```

### 4.2.4 数据库设计

#### ClickHouse 新增表

```sql
-- 预测记录表
CREATE TABLE creative_predictions (
    id UUID DEFAULT generateUUIDv4(),
    creative_id String,
    account_id String,
    predicted_ctr_low Float64,
    predicted_ctr_high Float64,
    predicted_roas_low Float64,
    predicted_roas_high Float64,
    confidence Float64,
    evidence Array(String),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (account_id, created_at);

-- 复盘记录表
CREATE TABLE creative_retros (
    id UUID DEFAULT generateUUIDv4(),
    prediction_id UUID,
    creative_id String,
    account_id String,
    predicted_ctr_low Float64,
    predicted_ctr_high Float64,
    actual_ctr Float64,
    predicted_roas_low Float64,
    predicted_roas_high Float64,
    actual_roas Float64,
    ctr_error Float64,
    roas_error Float64,
    direction Enum('over' = 1, 'under' = 2, 'accurate' = 3),
    insights Array(String),
    reviewed_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (account_id, reviewed_at);

-- 公式进化日志表
CREATE TABLE formula_evolution_log (
    id UUID DEFAULT generateUUIDv4(),
    formula_id String,
    account_id String,
    old_version Int32,
    new_version Int32,
    old_weights Map(String, Float64),
    new_weights Map(String, Float64),
    old_accuracy Float64,
    new_accuracy Float64,
    trigger_reason String,
    evolved_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (account_id, evolved_at);
```

### 4.2.5 API 设计

```python
# src/api/routes/prediction.py

@router.post("/predict")
async def predict_creative(request: PredictionRequest):
    """对素材进行投放预测"""
    predictor = CreativePredictor()
    prediction = predictor.predict(request.features, request.history)
    # 存储预测记录
    await store_prediction(prediction)
    return prediction

@router.post("/retro")
async def review_prediction(request: RetroRequest):
    """复盘预测结果"""
    retro_engine = RetroEngine()
    prediction = await get_prediction(request.prediction_id)
    actual = await get_actual_data(request.creative_id)
    result = retro_engine.review(prediction, actual)
    # 存储复盘结果
    await store_retro(result)
    # 检查是否触发公式进化
    if retro_engine.check_evolution_trigger(await get_recent_retros()):
        await trigger_evolution(request.account_id)
    return result

@router.post("/evolve")
async def evolve_formula(request: EvolutionRequest):
    """触发公式进化"""
    evolver = FormulaEvolver()
    formula = await get_formula(request.formula_id)
    retros = await get_retros_for_formula(request.formula_id)
    evolved = evolver.evolve(formula, retros)
    await save_formula(evolved)
    return evolved
```

### 4.2.6 前端界面变化

#### CreativeInsightNew.tsx — 新增第6个Tab「预测实验室」

```typescript
// 新增 Tab 内容
const PredictionLab = () => {
  return (
    <div className="prediction-lab">
      {/* 活跃预测卡片 */}
      <section className="active-predictions">
        <h3>🎯 活跃预测</h3>
        <div className="prediction-cards">
          {predictions.map(p => (
            <PredictionCard
              key={p.id}
              prediction={p}
              status={p.status} // 'pending' | 'reviewed'
            />
          ))}
        </div>
      </section>

      {/* 预测准确率趋势 */}
      <section className="accuracy-trend">
        <h3>📈 预测准确率趋势</h3>
        <ReactECharts option={accuracyChartOption} />
      </section>

      {/* 公式进化日志 */}
      <section className="evolution-log">
        <h3>🧬 公式进化日志</h3>
        <Timeline>
          {evolutionLogs.map(log => (
            <Timeline.Item key={log.id}>
              <FormulaEvolutionCard log={log} />
            </Timeline.Item>
          ))}
        </Timeline>
      </section>
    </div>
  );
};
```

#### Dashboard.tsx — 新增「预测 vs 实际」对比卡片

```typescript
const PredictionVsActualCard = () => {
  return (
    <Card title="🎯 预测 vs 实际">
      <div className="comparison-grid">
        <div className="metric">
          <span className="label">CTR</span>
          <span className="predicted">预测: {predicted.ctr}</span>
          <span className="actual">实际: {actual.ctr}</span>
          <span className={`error ${errorClass}`}>{error}%</span>
        </div>
        {/* 更多指标... */}
      </div>
      <div className="trend-chart">
        <ReactECharts option={trendChartOption} />
      </div>
    </Card>
  );
};
```

---

## 4.3 方案二：爆款公式自动进化（P0）

### 4.3.1 设计理念

将固定的 f1-f7 公式改造为"活公式"，能够根据投放数据自动调整权重和标签组合。

### 4.3.2 公式数据结构升级

#### 现有结构（固定）

```typescript
const f1 = {
  name: '末世建造',
  tags: ['建造', '经营', 'SLG'],
  weight: 1.0
}
```

#### 升级结构（可进化）

```typescript
const f1 = {
  id: 'f1',
  name: '末世建造',
  tags: ['建造', '经营', 'SLG'],
  weights: {
    '建造': 1.0,
    '经营': 0.8,
    'SLG': 0.9,
    '末日': 0.7,
    '生存': 0.6,
  },
  // 新增字段
  version: 3,
  lastEvolved: '2026-05-28',
  hitRate: 0.72,                    // 历史命中率
  sampleCount: 45,                  // 样本量
  confidence: 0.85,                 // 置信度
  evidence: [                       // 支撑数据
    { creativeId: 'c123', roas: 2.5, tags: ['建造','末日'] },
    { creativeId: 'c456', roas: 1.8, tags: ['经营','SLG'] },
  ],
  evolutionLog: [                   // 进化日志
    {
      version: 2,
      date: '2026-05-15',
      trigger: '连续3次高估',
      changes: { '末日': 0.5 → 0.7 },
      accuracyBefore: 0.65,
      accuracyAfter: 0.72,
    },
  ],
}
```

### 4.3.3 后端实现

#### `src/creative/formula_manager.py` — 公式管理器

```python
class FormulaManager:
    """爆款公式管理器"""

    def get_formulas(self, account_id: str) -> list[dict]:
        """获取账户的所有公式（含进化状态）"""
        formulas = self._load_formulas(account_id)
        for f in formulas:
            f['health'] = self._calc_health(f)
        return formulas

    def update_formula(self, formula_id: str, new_weights: dict) -> dict:
        """更新公式权重"""
        ...

    def _calc_health(self, formula: dict) -> dict:
        """计算公式健康度"""
        return {
            'hitRate': formula['hitRate'],
            'sampleCount': formula['sampleCount'],
            'confidence': formula['confidence'],
            'lastEvolved': formula['lastEvolved'],
            'needsEvolution': self._check_needs_evolution(formula),
        }

    def _check_needs_evolution(self, formula: dict) -> bool:
        """检查是否需要进化"""
        # 连续3次预测偏差 > 20%
        recent_retros = self._get_recent_retros(formula['id'], limit=3)
        if len(recent_retros) < 3:
            return False
        return all(r['ctr_error'] > 0.2 for r in recent_retros)
```

### 4.3.4 前端界面变化

#### Workshop.tsx — 重构为「公式工作台」

```typescript
const WorkshopPage = () => {
  return (
    <div className="workshop">
      {/* 公式健康度概览 */}
      <section className="formula-health-overview">
        <h3>📊 公式健康度</h3>
        <div className="health-cards">
          {formulas.map(f => (
            <FormulaHealthCard
              key={f.id}
              formula={f}
              onEvolve={() => handleEvolve(f.id)}
            />
          ))}
        </div>
      </section>

      {/* 进化建议面板 */}
      <section className="evolution-suggestions">
        <h3>🧬 进化建议</h3>
        <Alert
          type="warning"
          message="公式 f3（解压治愈）连续3次预测偏差 > 20%，建议进化"
          action={
            <Button size="small" onClick={() => handleEvolve('f3')}>
              立即进化
            </Button>
          }
        />
      </section>

      {/* 公式详情 */}
      <section className="formula-details">
        {selectedFormula && (
          <FormulaDetail
            formula={selectedFormula}
            evolutionLog={selectedFormula.evolutionLog}
            onWeightChange={handleWeightChange}
          />
        )}
      </section>
    </div>
  );
};

// 公式健康度卡片组件
const FormulaHealthCard = ({ formula, onEvolve }) => {
  const healthColor = formula.health.hitRate > 0.7 ? 'green' :
                      formula.health.hitRate > 0.5 ? 'yellow' : 'red';

  return (
    <Card
      title={formula.name}
      extra={<Tag color={healthColor}>{formula.version}次进化</Tag>}
    >
      <div className="health-metrics">
        <div className="metric">
          <span className="label">命中率</span>
          <Progress percent={formula.health.hitRate * 100} />
        </div>
        <div className="metric">
          <span className="label">样本量</span>
          <span className="value">{formula.health.sampleCount}</span>
        </div>
        <div className="metric">
          <span className="label">上次进化</span>
          <span className="value">{formula.health.lastEvolved}</span>
        </div>
      </div>
      {formula.health.needsEvolution && (
        <Button type="primary" danger onClick={onEvolve}>
          ⚠️ 需要进化
        </Button>
      )}
    </Card>
  );
};
```

---

## 4.4 方案三：盲预测隔离机制（P1）

### 4.4.1 设计理念

借鉴 Cheat-on-Content 的"盲子代理"概念，在预测时隔离实际数据，保证预测的客观性。

### 4.4.2 实现方式

```python
class BlindPredictor:
    """盲预测器 - 隔离实际数据"""

    def predict(self, creative_features: dict) -> Prediction:
        """
        盲预测：只能访问内容特征，不能访问实际投放数据

        Args:
            creative_features: {
                'tags': ['建造', '末日'],
                'duration': 30,
                'style': '快节奏',
                'has_voiceover': True,
                ...
            }

        Returns:
            Prediction: 预测结果（基于历史统计，不看实际数据）
        """
        # 只使用历史样本的统计特征
        historical_stats = self._get_historical_stats(
            tags=creative_features['tags'],
            duration_range=self._get_duration_range(creative_features['duration']),
            style=creative_features['style'],
        )

        return Prediction(
            ctr_range=(historical_stats['ctr_p25'], historical_stats['ctr_p75']),
            roas_range=(historical_stats['roas_p25'], historical_stats['roas_p75']),
            confidence=self._calc_confidence(historical_stats['sample_count']),
            evidence=[
                f"基于 {historical_stats['sample_count']} 个相似素材的历史数据",
                f"标签匹配度: {historical_stats['tag_match_score']:.0%}",
            ],
        )

    def _get_historical_stats(self, **filters) -> dict:
        """
        获取历史统计数据（脱敏版本）

        注意：只返回统计指标，不返回具体素材的实际表现数据
        """
        # 查询 ClickHouse 获取统计数据
        query = """
        SELECT
            quantile(0.25)(ctr) as ctr_p25,
            quantile(0.75)(ctr) as ctr_p75,
            quantile(0.25)(roas) as roas_p25,
            quantile(0.75)(roas) as roas_p75,
            count() as sample_count
        FROM creative_performance
        WHERE hasAll(tags, {tags:Array(String)})
          AND duration BETWEEN {dur_min:UInt32} AND {dur_max:UInt32}
        """
        return self._execute_query(query, filters)
```

### 4.4.3 前端交互设计

```typescript
// 预测模式切换
const PredictionModeToggle = () => {
  const [mode, setMode] = useState<'blind' | 'informed'>('blind');

  return (
    <div className="prediction-mode">
      <Radio.Group value={mode} onChange={e => setMode(e.target.value)}>
        <Radio.Button value="blind">
          🎯 盲预测（推荐）
          <Tooltip title="预测时隐藏实际数据，保证客观性">
            <QuestionCircleOutlined />
          </Tooltip>
        </Radio.Button>
        <Radio.Button value="informed">
          📊 参考预测
          <Tooltip title="预测时可参考历史数据">
            <QuestionCircleOutlined />
          </Tooltip>
        </Radio.Button>
      </Radio.Group>

      {mode === 'blind' && (
        <Alert
          type="info"
          message="盲预测模式：AI只能看到素材特征，无法访问实际投放数据"
        />
      )}
    </div>
  );
};
```

---

## 4.5 方案四：个人评分体系（P1）

### 4.5.1 设计理念

从"通用标签+固定公式"升级为"从你的历史数据推导个性化评分标准"。

### 4.5.2 后端实现

```python
class PersonalRubric:
    """个人评分体系 - 从历史数据推导"""

    def derive_from_history(self, account_id: str) -> dict:
        """
        从账户历史数据推导个性化评分体系

        Returns:
            {
                'dimensions': [
                    {
                        'name': '视觉冲击力',
                        'weight': 0.85,
                        'evidence': '高ROAS素材中85%包含战斗特效',
                        'data_driven': True,
                    },
                    ...
                ],
                'top_patterns': [...],
                'generated_at': '2026-06-02',
            }
        """
        # 1. 获取历史高ROAS素材
        top_creatives = self._get_top_creatives(account_id, metric='roas', top_n=20)

        # 2. 分析共同特征
        common_patterns = self._analyze_patterns(top_creatives)

        # 3. 生成个性化维度
        dimensions = self._generate_dimensions(common_patterns)

        # 4. 验证维度有效性
        validated = self._validate_dimensions(dimensions, account_id)

        return {
            'dimensions': validated,
            'top_patterns': common_patterns,
            'generated_at': datetime.now().isoformat(),
        }

    def _analyze_patterns(self, creatives: list) -> list[dict]:
        """分析高ROAS素材的共同特征"""
        # 统计标签出现频率
        tag_freq = Counter()
        for c in creatives:
            tag_freq.update(c['tags'])

        # 计算标签与ROAS的相关性
        correlations = {}
        for tag in tag_freq:
            with_tag = [c for c in creatives if tag in c['tags']]
            without_tag = [c for c in creatives if tag not in c['tags']]
            if with_tag and without_tag:
                avg_roas_with = mean([c['roas'] for c in with_tag])
                avg_roas_without = mean([c['roas'] for c in without_tag])
                correlations[tag] = avg_roas_with - avg_roas_without

        return sorted(correlations.items(), key=lambda x: x[1], reverse=True)
```

### 4.5.3 前端界面变化

#### CreativeInsightNew.tsx — 「趋势分析」Tab升级

```typescript
const PersonalTrendTab = () => {
  return (
    <div className="personal-trends">
      {/* 个性化评分雷达图 */}
      <section className="personal-radar">
        <h3>🎯 你的账户专属评分维度</h3>
        <ReactECharts option={personalRadarOption} />
        <div className="dimension-list">
          {dimensions.map(d => (
            <div key={d.name} className="dimension-item">
              <span className="name">{d.name}</span>
              <Progress percent={d.weight * 100} />
              <span className="evidence">{d.evidence}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 你的高ROAS素材共同特征 */}
      <section className="top-patterns">
        <h3>📈 你的高ROAS素材共同特征</h3>
        <div className="pattern-cards">
          {topPatterns.map(p => (
            <PatternCard key={p.tag} pattern={p} />
          ))}
        </div>
      </section>
    </div>
  );
};
```

---

## 4.6 方案五：跨账户基准对比（P2）

### 4.6.1 设计理念

借鉴 Cheat-on-Content 的"基准账号"概念，将当前账户表现与竞品/标杆对比。

### 4.6.2 后端实现

```python
class BenchmarkComparator:
    """基准对比器"""

    def compare(self, account_id: str, benchmark_id: str) -> dict:
        """
        对比当前账户与基准账户

        Returns:
            {
                'metrics_comparison': {
                    'ctr': {'current': 0.025, 'benchmark': 0.030, 'diff': -16.7},
                    'roas': {'current': 1.8, 'benchmark': 1.5, 'diff': +20.0},
                    ...
                },
                'creative_diversity': 0.7,
                'recommendations': [
                    'CTR低于基准15%，建议增加战斗特效标签素材',
                    'ROAS高于基准20%，保持当前创意策略',
                ],
            }
        """
        current = self._get_account_stats(account_id)
        benchmark = self._get_account_stats(benchmark_id)

        return {
            'metrics_comparison': self._compare_metrics(current, benchmark),
            'creative_diversity': self._calc_diversity(account_id),
            'recommendations': self._generate_recommendations(current, benchmark),
        }
```

### 4.6.3 前端界面变化

#### PlatformData.tsx — 新增「你 vs 竞品」对比面板

```typescript
const BenchmarkComparison = () => {
  return (
    <div className="benchmark-comparison">
      <h3>📊 你 vs 竞品对比</h3>

      {/* 指标对比表 */}
      <Table columns={comparisonColumns} dataSource={comparisonData} />

      {/* 差距最大的维度 */}
      <section className="gap-analysis">
        <h4>🎯 差距最大的维度</h4>
        {gaps.map(gap => (
          <Alert
            key={gap.metric}
            type={gap.diff > 0 ? 'success' : 'warning'}
            message={`${gap.metric}: ${gap.diff > 0 ? '+' : ''}${gap.diff}%`}
            description={gap.recommendation}
          />
        ))}
      </section>
    </div>
  );
};
```

---

# 第五部分：实施路线图

## 5.1 三阶段实施计划

### 第一阶段：闭环基础（2-3周）

**目标：** 建立预测-复盘的基本闭环

| 任务 | 负责模块 | 工作量 |
|------|---------|--------|
| 创建 ClickHouse 预测/复盘表 | 🧠DATA | 1天 |
| 实现 `CreativePredictor` | 🎨CREATIVE | 3天 |
| 实现 `RetroEngine` | 🎨CREATIVE | 2天 |
| 实现 `FormulaEvolver` 基础版 | 🎨CREATIVE | 2天 |
| 新增预测/复盘 API | 🎨CREATIVE | 1天 |
| 前端「预测实验室」Tab | 🎨CREATIVE | 3天 |
| Dashboard「预测 vs 实际」卡片 | 🎨CREATIVE | 1天 |

### 第二阶段：公式进化（2-3周）

**目标：** 实现公式自动进化机制

| 任务 | 负责模块 | 工作量 |
|------|---------|--------|
| 公式数据结构升级 | 🎨CREATIVE | 1天 |
| 实现 `FormulaManager` | 🎨CREATIVE | 2天 |
| 实现进化触发逻辑 | 🧠DATA | 2天 |
| 实现新旧公式对比验证 | 🧠DATA | 2天 |
| Workshop 页面重构 | 🎨CREATIVE | 3天 |
| 进化日志展示 | 🎨CREATIVE | 1天 |

### 第三阶段：个性化与隔离（2-3周）

**目标：** 实现盲预测和个人评分体系

| 任务 | 负责模块 | 工作量 |
|------|---------|--------|
| 实现 `BlindPredictor` | ⚡EXECUTION | 2天 |
| 实现 `PersonalRubric` | 🎨CREATIVE | 3天 |
| 前端盲预测模式切换 | ⚡EXECUTION | 1天 |
| 前端个性化雷达图 | 🎨CREATIVE | 2天 |
| 基准对比功能 | 💾MEMORY | 3天 |

## 5.2 风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| 历史数据不足 | 预测精度低 | 设置最低样本量要求，不足时显示"数据积累中" |
| 公式进化过度拟合 | 过度适应近期数据 | 保留进化历史，支持回滚到任意版本 |
| 盲预测隔离不彻底 | 数据泄露 | 严格的数据访问控制，预测接口不查询实际数据 |
| 计算资源消耗 | 大量历史数据计算 | 增量计算 + 缓存，避免全量重算 |

## 5.3 成功指标

| 指标 | 目标值 | 衡量方式 |
|------|--------|---------|
| 预测准确率 | > 70% | CTR/ROAS预测误差 < 20%的比例 |
| 公式进化成功率 | > 60% | 进化后准确率提升的比例 |
| 闭环完成率 | > 80% | 有预测的素材中完成复盘的比例 |
| 用户采用率 | > 50% | 使用预测功能的用户占比 |

---

# 总结

## Cheat-on-Content 给我们的最大启发

> **从「AI帮你生成内容」转向「AI帮你评判内容，并持续校准评判标准」**

你的系统目前偏向"生成"（创意简报、优化建议），而 Cheat-on-Content 的核心是"评判+进化"。把这两者结合，你的系统就能做到：

1. 先用 CLIP 打标 + 元素排名**分析素材**
2. 再用历史数据**预测表现**
3. 发布后**自动复盘**，验证预测
4. 根据复盘结果**进化公式**
5. 下一轮预测更准 → 形成**判断力的复利增长**

这就是 Cheat-on-Content 最值得借鉴的「闭环复利」思维。

---

*文档完成 | 2026-06-02*