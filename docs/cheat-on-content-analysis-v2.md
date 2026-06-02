# Cheat-on-Content × 游戏买量系统：对比分析与改进方案 v2

> 文档版本：v2.1（生产级增强版 + 管理者模式同步）
> 生成时间：2026-06-02
> v1 → v2 变更：整合7项生产级增强（影子模式、冷启动降级、不确定度分解、复合进化触发、盲隔离工程化、人机协作闸门、业务指标重定义）
> v2 → v2.1 变更：补充管理者模式7个页面的同步改动方案（ManagerDashboard/ManagerCreativeInsight/ManagerDataDiagnosis/ManagerReports/ManagerSafety/ManagerExecution/ManagerMemory）

---

## 目录

- [第一部分：产品一 — Cheat-on-Content](#第一部分产品一--cheat-on-content)
- [第二部分：产品二 — 游戏买量系统](#第二部分产品二--游戏买量系统)
- [第三部分：对比分析](#第三部分对比分析)
- [第四部分：改进方案（v2 生产级增强版）](#第四部分改进方案v2-生产级增强版)
  - [4.1 方案总览](#41-方案总览)
  - [4.2 方案一：预测-复盘闭环系统](#42-方案一预测-复盘闭环系统p0)
  - [4.3 方案二：爆款公式自动进化](#43-方案二爆款公式自动进化p0)
  - [4.4 方案三：盲预测隔离机制](#44-方案三盲预测隔离机制p1)
  - [4.5 方案四：个人评分体系](#45-方案四个人评分体系p1)
  - [4.6 方案五：跨账户基准对比](#46-方案五跨账户基准对比p2)
  - [4.7 横切关注点](#47-横切关注点v2-核心新增)
  - [4.8 管理者模式同步改动](#48-管理者模式同步改动v2-核心新增) ← v2.1 新增
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

# 第四部分：改进方案（v2 生产级增强版）

> **v2 核心升级：** 从"概念验证"提升到"生产可用"。每个方案都增加了安全性、鲁棒性、人机协作的工程考量。

## 4.1 方案总览

| 方案 | 名称 | 优先级 | 工作量 | 价值 | 涉及模块 | v2 增强 |
|------|------|--------|--------|------|---------|---------|
| **方案一** | 预测-复盘闭环系统 | P0 | 中 | ⭐⭐⭐⭐⭐ | 🎨CREATIVE + 💾MEMORY | +影子模式 +异常清洗 |
| **方案二** | 爆款公式自动进化 | P0 | 中 | ⭐⭐⭐⭐⭐ | 🧠DATA + 🎨CREATIVE | +EvolutionSafetyNet +回滚 |
| **方案三** | 盲预测隔离机制 | P1 | 小 | ⭐⭐⭐⭐ | ⚡EXECUTION + 🛡️SAFETY | +BlindnessGuard +审计 |
| **方案四** | 个人评分体系 | P1 | 大 | ⭐⭐⭐⭐ | 🎨CREATIVE + 🧠DATA | +冷启动三阶段降级 |
| **方案五** | 跨账户基准对比 | P2 | 中 | ⭐⭐⭐ | 💾MEMORY + 🧠DATA | +行业基准库 |

**v2 新增横切关注点：**

| 关注点 | 覆盖方案 | 设计文档 |
|--------|---------|---------|
| **冷启动降级** | 方案一/二/三/四 | §4.7.1 |
| **不确定度分解** | 方案一/三 | §4.7.2 |
| **人机协作闸门** | 方案一/二/四 | §4.7.3 |
| **业务指标重定义** | 全部 | §4.7.4 |

---

## 4.2 方案一：预测-复盘闭环系统（P0）

### 4.2.1 设计理念

借鉴 Cheat-on-Content 的核心五步闭环，为每次素材投放建立"预测→验证→进化"的完整循环。

**v2 增强：** 增加异常清洗、不确定度分解、影子模式验证。

### 4.2.2 流程设计

```
现有流程：
素材打标 → 元素排名 → 创意简报 → [结束]

新增闭环（v2 增强版）：
素材打标 → 元素排名 → 创意简报 → 盲预测 → 发布标记
                                                ↓
                        ┌─────── T+3 自动复盘 ←──┘
                        ↓              ↓
                   异常清洗        不确定度评估
                        ↓              ↓
                   复盘报告 ←── 偏差分级（Normal/Moderate/Severe）
                        ↓
                   多条件复合判断 → 是否触发进化？
                        ↓                    ↓
                       是                    否
                        ↓                    ↓
                   生成候选公式          记录但不触发
                        ↓
                   人工审核闸门
                        ↓              ↓
                   通过              拒绝
                        ↓              ↓
                   影子模式验证      保留旧公式
                   （5-10次真实投放）
                        ↓              ↓
                   表现优于旧公式？  表现恶化？
                        ↓              ↓
                   自动生效          告警 + 一键回滚
```

### 4.2.3 后端新增模块

#### `src/creative/predictor.py` — 预测引擎（v2 增强）

```python
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum

class PredictionMode(Enum):
    BLIND = "blind"           # 盲预测：只看内容特征
    INFORMED = "informed"     # 参考预测：可访问历史统计

class UncertaintySource(Enum):
    DATA = "data"             # 数据不确定度（样本量不足）
    MODEL = "model"           # 模型不确定度（公式版本太新）
    ENVIRONMENT = "environment"  # 环境不确定度（节假日/竞品冲击）

@dataclass
class Uncertainty:
    """不确定度分解"""
    total: float                              # 总不确定度 0-1
    sources: dict[UncertaintySource, float]   # 各来源分量
    explanation: str                          # 人类可读解释

@dataclass
class Prediction:
    """投放预测结果（v2 增强版）"""
    creative_id: str
    predicted_ctr: tuple[float, float]        # (P25, P75) 区间
    predicted_cvr: tuple[float, float]
    predicted_roas: tuple[float, float]
    confidence: float                          # 置信度 0-1
    uncertainty: Uncertainty                   # v2: 不确定度分解
    mode: PredictionMode                       # v2: 预测模式
    data_access_log: list[str]                 # v2: 数据访问审计日志
    evidence: list[str]
    created_at: str

class CreativePredictor:
    """素材表现预测器（v2 增强版）"""

    # v2: 冷启动行业基准（按游戏品类）
    INDUSTRY_BENCHMARKS = {
        'SLG': {'ctr_p25': 0.015, 'ctr_p75': 0.035, 'roas_p25': 0.8, 'roas_p75': 2.0},
        'RPG': {'ctr_p25': 0.020, 'ctr_p75': 0.045, 'roas_p25': 0.6, 'roas_p75': 1.8},
        '休闲': {'ctr_p25': 0.025, 'ctr_p75': 0.055, 'roas_p25': 0.5, 'roas_p75': 1.5},
        '竞技': {'ctr_p25': 0.018, 'ctr_p75': 0.040, 'roas_p25': 0.7, 'roas_p75': 1.9},
    }

    def predict(
        self,
        creative_features: dict,
        historical_data: Optional[list] = None,
        mode: PredictionMode = PredictionMode.BLIND,
    ) -> Prediction:
        """
        v2 增强预测：支持冷启动降级 + 不确定度分解

        三阶段个性化权重：
        - 阶段一（0-20条）：行业先验 100%，标注"冷启动预测"
        - 阶段二（20-100条）：行业先验 + 账户数据混合
        - 阶段三（100+条）：账户数据 100%
        """
        access_log = []  # v2: 数据访问审计

        # v2: 冷启动判断
        sample_count = len(historical_data) if historical_data else 0

        if sample_count < 20:
            # 阶段一：冷启动，使用行业基准
            stats = self._get_industry_benchmark(creative_features.get('genre', 'SLG'))
            access_log.append(f"行业基准查询: genre={creative_features.get('genre')}")
            uncertainty = Uncertainty(
                total=0.6,
                sources={
                    UncertaintySource.DATA: 0.4,
                    UncertaintySource.MODEL: 0.15,
                    UncertaintySource.ENVIRONMENT: 0.05,
                },
                explanation="冷启动阶段，样本量不足，使用行业基准预测，准确度有限",
            )
        elif sample_count < 100:
            # 阶段二：混合模式
            industry = self._get_industry_benchmark(creative_features.get('genre', 'SLG'))
            account = self._calc_account_stats(historical_data)
            alpha = sample_count / 100  # 账户数据权重随样本增长
            stats = {
                'ctr_p25': industry['ctr_p25'] * (1 - alpha) + account['ctr_p25'] * alpha,
                'ctr_p75': industry['ctr_p75'] * (1 - alpha) + account['ctr_p75'] * alpha,
                'roas_p25': industry['roas_p25'] * (1 - alpha) + account['roas_p25'] * alpha,
                'roas_p75': industry['roas_p75'] * (1 - alpha) + account['roas_p75'] * alpha,
            }
            access_log.append(f"混合模式: alpha={alpha:.2f}, 行业权重={1-alpha:.2f}")
            uncertainty = Uncertainty(
                total=0.35,
                sources={
                    UncertaintySource.DATA: 0.2,
                    UncertaintySource.MODEL: 0.1,
                    UncertaintySource.ENVIRONMENT: 0.05,
                },
                explanation=f"数据积累中（{sample_count}条），行业先验权重{1-alpha:.0%}",
            )
        else:
            # 阶段三：完全个性化
            similar = self._find_similar(creative_features, historical_data)
            stats = self._calc_percentile_stats(similar)
            access_log.append(f"个性化预测: {len(similar)}个相似素材")
            uncertainty = self._calc_uncertainty(len(similar), creative_features)

        # v2: 外部市场因子调整
        market_adjustment = self._get_market_adjustment()
        if market_adjustment['is_holiday']:
            uncertainty.sources[UncertaintySource.ENVIRONMENT] += 0.1
            uncertainty.total = min(uncertainty.total + 0.1, 1.0)
            access_log.append(f"节假日调整: {market_adjustment['holiday_name']}")

        return Prediction(
            creative_id=creative_features['id'],
            predicted_ctr=(stats['ctr_p25'], stats['ctr_p75']),
            predicted_cvr=(0.0, 0.0),  # 简化
            predicted_roas=(stats['roas_p25'], stats['roas_p75']),
            confidence=1.0 - uncertainty.total,
            uncertainty=uncertainty,
            mode=mode,
            data_access_log=access_log,
            evidence=self._generate_evidence(stats, sample_count),
            created_at=datetime.now().isoformat(),
        )

    def _get_industry_benchmark(self, genre: str) -> dict:
        """v2: 获取行业基准（从竞品爬虫数据构建）"""
        return self.INDUSTRY_BENCHMARKS.get(genre, self.INDUSTRY_BENCHMARKS['SLG'])

    def _calc_uncertainty(self, sample_count: int, features: dict) -> Uncertainty:
        """v2: 计算不确定度分解"""
        data_unc = max(0, 0.3 - sample_count * 0.003)  # 样本越多越低
        model_unc = 0.05  # 公式成熟后较低
        env_unc = self._get_env_uncertainty()  # 基于近期市场波动

        total = data_unc + model_unc + env_unc
        explanation_parts = []
        if data_unc > 0.1:
            explanation_parts.append(f"相似素材偏少（{sample_count}个）")
        if env_unc > 0.1:
            explanation_parts.append("近期市场波动较大")

        return Uncertainty(
            total=min(total, 1.0),
            sources={
                UncertaintySource.DATA: data_unc,
                UncertaintySource.MODEL: model_unc,
                UncertaintySource.ENVIRONMENT: env_unc,
            },
            explanation="；".join(explanation_parts) if explanation_parts else "预测置信度较高",
        )

    def _get_market_adjustment(self) -> dict:
        """v2: 获取外部市场因子（节假日/竞品冲击）"""
        # 对接日历API + 竞品投放量监控
        ...

    def _get_env_uncertainty(self) -> float:
        """v2: 基于近期市场波动计算环境不确定度"""
        ...
```

#### `src/creative/retro.py` — 复盘引擎（v2 增强）

```python
from enum import Enum

class DeviationLevel(Enum):
    NORMAL = "normal"         # 误差 < 15%
    MODERATE = "moderate"     # 误差 15%-30%
    SEVERE = "severe"         # 误差 > 30%

@dataclass
class RetroResult:
    """复盘结果（v2 增强版）"""
    prediction_id: str
    creative_id: str
    predicted: Prediction
    actual: ActualData
    ctr_error: float
    roas_error: float
    direction: str                     # 'over' | 'under' | 'accurate'
    deviation_level: DeviationLevel    # v2: 偏差严重程度分级
    is_clean: bool                     # v2: 是否通过异常清洗
    exclusion_reason: Optional[str]    # v2: 被排除的原因（如有）
    insights: list[str]

class RetroEngine:
    """复盘引擎（v2 增强版）"""

    # v2: 异常清洗规则
    CLEANING_RULES = {
        'min_spend': 50,              # 最低花费阈值（美元）
        'min_impressions': 1000,      # 最低曝光量
        'cold_start_days': 3,         # 冷启动期天数
        'iqr_multiplier': 1.5,        # IQR异常值倍数
    }

    def review(self, prediction: Prediction, actual: ActualData) -> RetroResult:
        """v2 增强复盘：含异常清洗 + 偏差分级"""

        # v2: 异常清洗
        is_clean, exclusion_reason = self._clean_data(actual)
        if not is_clean:
            return RetroResult(
                prediction_id=prediction.id,
                creative_id=actual.creative_id,
                predicted=prediction,
                actual=actual,
                ctr_error=0.0,
                roas_error=0.0,
                direction='excluded',
                deviation_level=DeviationLevel.NORMAL,
                is_clean=False,
                exclusion_reason=exclusion_reason,
                insights=[f"数据已排除: {exclusion_reason}"],
            )

        # 计算误差
        ctr_error = abs(prediction.predicted_ctr[1] - actual.ctr) / actual.ctr
        roas_error = abs(prediction.predicted_roas[1] - actual.roas) / actual.roas

        # v2: 偏差分级
        max_error = max(ctr_error, roas_error)
        if max_error < 0.15:
            deviation_level = DeviationLevel.NORMAL
        elif max_error < 0.30:
            deviation_level = DeviationLevel.MODERATE
        else:
            deviation_level = DeviationLevel.SEVERE

        # 方向判断
        if ctr_error < 0.1:
            direction = 'accurate'
        elif actual.ctr > prediction.predicted_ctr[1]:
            direction = 'under'
        else:
            direction = 'over'

        return RetroResult(
            prediction_id=prediction.id,
            creative_id=actual.creative_id,
            predicted=prediction,
            actual=actual,
            ctr_error=ctr_error,
            roas_error=roas_error,
            direction=direction,
            deviation_level=deviation_level,
            is_clean=True,
            exclusion_reason=None,
            insights=self._generate_insights(prediction, actual, deviation_level),
        )

    def _clean_data(self, actual: ActualData) -> tuple[bool, Optional[str]]:
        """
        v2: 异常数据清洗

        排除条件：
        1. 花费低于最低阈值（投放不充分）
        2. 曝光量不足（数据不可信）
        3. 冷启动期内（投放刚开始不稳定）
        4. IQR突增点（异常波动）
        """
        if actual.spend < self.CLEANING_RULES['min_spend']:
            return False, f"花费不足（{actual.spend} < {self.CLEANING_RULES['min_spend']}）"
        if actual.impressions < self.CLEANING_RULES['min_impressions']:
            return False, f"曝光不足（{actual.impressions} < {self.CLEANING_RULES['min_impressions']}）"
        if actual.days_since_launch < self.CLEANING_RULES['cold_start_days']:
            return False, f"冷启动期（上线{actual.days_since_launch}天 < {self.CLEANING_RULES['cold_start_days']}天）"
        return True, None

    def check_evolution_trigger(
        self,
        recent_retros: list[RetroResult],
        min_samples: int = 10,
        cooldown_days: int = 7,
        last_evolution_date: Optional[str] = None,
    ) -> tuple[bool, str]:
        """
        v2: 多条件复合进化触发判断

        触发条件（全部满足）：
        1. RMSE 超过阈值（整体误差超标）
        2. 严重偏差占比 > 30%（Severe级别占比高）
        3. 样本量 >= min_samples（数据充分）
        4. 距上次进化 > cooldown_days（冷却期已过）
        5. 非特殊时期（非节假日/大促）

        返回: (是否触发, 触发原因)
        """
        # 过滤已清洗的数据
        clean_retros = [r for r in recent_retros if r.is_clean]

        # 条件3: 样本量
        if len(clean_retros) < min_samples:
            return False, f"样本量不足（{len(clean_retros)} < {min_samples}）"

        # 条件4: 冷却期
        if last_evolution_date:
            days_since = (datetime.now() - datetime.fromisoformat(last_evolution_date)).days
            if days_since < cooldown_days:
                return False, f"冷却期未过（{days_since}天 < {cooldown_days}天）"

        # 条件1: RMSE
        rmse = (sum(r.ctr_error ** 2 for r in clean_retros) / len(clean_retros)) ** 0.5
        if rmse < 0.20:
            return False, f"RMSE正常（{rmse:.2f} < 0.20）"

        # 条件2: 严重偏差占比
        severe_count = sum(1 for r in clean_retros if r.deviation_level == DeviationLevel.SEVERE)
        severe_ratio = severe_count / len(clean_retros)
        if severe_ratio < 0.30:
            return False, f"严重偏差占比低（{severe_ratio:.0%} < 30%）"

        # 条件5: 特殊时期检查
        if self._is_special_period():
            return False, "当前为特殊时期（节假日/大促），暂停进化"

        return True, f"RMSE={rmse:.2f}, 严重偏差占比={severe_ratio:.0%}, 样本量={len(clean_retros)}"

    def _is_special_period(self) -> bool:
        """检查是否为特殊时期（节假日/大促）"""
        # 对接日历API
        ...
```

### 4.2.4 数据库设计

#### ClickHouse 新增表

```sql
-- 预测记录表（v2 增强：增加不确定度字段）
CREATE TABLE creative_predictions (
    id UUID DEFAULT generateUUIDv4(),
    creative_id String,
    account_id String,
    mode Enum('blind' = 1, 'informed' = 2),
    predicted_ctr_low Float64,
    predicted_ctr_high Float64,
    predicted_roas_low Float64,
    predicted_roas_high Float64,
    confidence Float64,
    -- v2: 不确定度分解
    uncertainty_total Float64,
    uncertainty_data Float64,
    uncertainty_model Float64,
    uncertainty_environment Float64,
    uncertainty_explanation String,
    -- v2: 数据访问日志
    data_access_log Array(String),
    evidence Array(String),
    -- v2: 冷启动阶段标记
    cold_start_stage Enum('stage1' = 1, 'stage2' = 2, 'stage3' = 3),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (account_id, created_at);

-- 复盘记录表（v2 增强：增加清洗和分级字段）
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
    direction Enum('over' = 1, 'under' = 2, 'accurate' = 3, 'excluded' = 4),
    -- v2: 偏差分级和清洗
    deviation_level Enum('normal' = 1, 'moderate' = 2, 'severe' = 3),
    is_clean UInt8,
    exclusion_reason Nullable(String),
    insights Array(String),
    reviewed_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (account_id, reviewed_at);

-- 公式进化日志表（v2 增强：增加影子模式字段）
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
    -- v2: 影子模式
    shadow_mode_active UInt8 DEFAULT 0,
    shadow_trials Int32 DEFAULT 0,
    shadow_successes Int32 DEFAULT 0,
    -- v2: 人工审核
    human_approved Nullable(UInt8),
    human_reviewer Nullable(String),
    human_comment Nullable(String),
    evolved_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (account_id, evolved_at);
```

### 4.2.5 API 设计

```python
# src/api/routes/prediction.py

@router.post("/predict")
async def predict_creative(request: PredictionRequest):
    """
    对素材进行投放预测（v2 增强版）

    支持：
    - 盲预测/参考预测模式切换
    - 冷启动三阶段自动降级
    - 不确度分解返回
    """
    predictor = CreativePredictor()
    prediction = predictor.predict(
        request.features,
        request.history,
        mode=PredictionMode(request.mode),
    )
    await store_prediction(prediction)
    return {
        "prediction": prediction,
        "cold_start_stage": prediction.cold_start_stage,
        "uncertainty": prediction.uncertainty,
        "data_access_log": prediction.data_access_log,
    }

@router.post("/retro")
async def review_prediction(request: RetroRequest):
    """
    复盘预测结果（v2 增强版）

    支持：
    - 异常数据自动清洗
    - 偏差三级分级
    - 多条件复合进化触发
    """
    retro_engine = RetroEngine()
    prediction = await get_prediction(request.prediction_id)
    actual = await get_actual_data(request.creative_id)
    result = retro_engine.review(prediction, actual)

    await store_retro(result)

    if result.is_clean:
        should_evolve, reason = retro_engine.check_evolution_trigger(
            recent_retros=await get_recent_retros(request.account_id),
            min_samples=10,
            cooldown_days=7,
            last_evolution_date=await get_last_evolution_date(request.formula_id),
        )
        if should_evolve:
            await trigger_shadow_evolution(request.formula_id, reason)

    return {
        "retro": result,
        "evolution_triggered": should_evolve if result.is_clean else False,
        "evolution_reason": reason if result.is_clean else None,
    }

@router.get("/evolution/{formula_id}/status")
async def get_evolution_status(formula_id: str):
    """
    v2: 查询公式进化状态（含影子模式进度）
    """
    status = await get_evolution_status(formula_id)
    return {
        "formula_id": formula_id,
        "current_version": status.current_version,
        "shadow_active": status.shadow_active,
        "shadow_progress": f"{status.shadow_trials}/{status.SHADOW_TARGET}",
        "shadow_success_rate": status.shadow_successes / max(status.shadow_trials, 1),
        "human_approved": status.human_approved,
    }

@router.post("/evolution/{formula_id}/approve")
async def approve_evolution(formula_id: str, request: ApprovalRequest):
    """
    v2: 人工审核公式进化（进入影子模式）
    """
    # 人工确认后才进入影子模式
    await approve_evolution_candidate(
        formula_id=formula_id,
        approved=request.approved,
        reviewer=request.reviewer,
        comment=request.comment,
    )
    return {"status": "approved" if request.approved else "rejected"}
```

### 4.2.6 前端界面变化

#### CreativeInsightNew.tsx — 新增第6个Tab「预测实验室」

```typescript
const PredictionLab = () => {
  return (
    <div className="prediction-lab">
      {/* v2: 冷启动状态提示 */}
      <ColdStartBanner stage={coldStartStage} sampleCount={sampleCount} />

      {/* v2: 预测模式切换 */}
      <PredictionModeToggle />

      {/* 活跃预测卡片（v2: 含不确定度分解） */}
      <section className="active-predictions">
        <h3>🎯 活跃预测</h3>
        <div className="prediction-cards">
          {predictions.map(p => (
            <PredictionCard
              key={p.id}
              prediction={p}
              status={p.status}
              uncertainty={p.uncertainty}  // v2
              dataAccessLog={p.dataAccessLog}  // v2
            />
          ))}
        </div>
      </section>

      {/* v2: 预测排名相关性趋势（替代简单准确率） */}
      <section className="accuracy-trend">
        <h3>📈 预测排名相关性趋势（Spearman ρ）</h3>
        <ReactECharts option={spearmanChartOption} />
      </section>

      {/* v2: 影子模式监控面板 */}
      <section className="shadow-mode-monitor">
        <h3>🔬 影子模式监控</h3>
        <ShadowModePanel activeShadows={activeShadows} />
      </section>

      {/* 公式进化日志（v2: 含人工审核记录） */}
      <section className="evolution-log">
        <h3>🧬 公式进化日志</h3>
        <Timeline>
          {evolutionLogs.map(log => (
            <Timeline.Item key={log.id} color={log.humanApproved ? 'green' : 'orange'}>
              <FormulaEvolutionCard log={log} />
            </Timeline.Item>
          ))}
        </Timeline>
      </section>
    </div>
  );
};

// v2: 冷启动状态横幅
const ColdStartBanner = ({ stage, sampleCount }) => {
  if (stage === 3) return null; // 阶段三不显示

  const messages = {
    1: { type: 'warning', text: `冷启动阶段（${sampleCount}/20条数据），当前使用行业基准预测，准确度有限` },
    2: { type: 'info', text: `数据积累中（${sampleCount}/100条），行业先验权重${Math.round((1 - sampleCount/100) * 100)}%` },
  };

  return <Alert {...messages[stage]} showIcon closable />;
};

// v2: 不确定度展示组件
const UncertaintyBreakdown = ({ uncertainty }) => {
  return (
    <div className="uncertainty-breakdown">
      <div className="total">
        <span className="label">预测不确定度</span>
        <Progress
          percent={uncertainty.total * 100}
          status={uncertainty.total > 0.5 ? 'exception' : 'normal'}
        />
      </div>
      <div className="sources">
        <Tag color="blue">数据: {(uncertainty.sources.data * 100).toFixed(0)}%</Tag>
        <Tag color="purple">模型: {(uncertainty.sources.model * 100).toFixed(0)}%</Tag>
        <Tag color="orange">环境: {(uncertainty.sources.environment * 100).toFixed(0)}%</Tag>
      </div>
      <div className="explanation">{uncertainty.explanation}</div>
    </div>
  );
};

// v2: 数据访问清单（盲隔离透明化）
const DataAccessLog = ({ logs }) => {
  return (
    <Collapse size="small">
      <Collapse.Panel header="📋 数据访问清单" key="1">
        {logs.map((log, i) => (
          <div key={i} className="log-entry">
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>{log}</span>
          </div>
        ))}
        <div className="log-entry blocked">
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          <span>未访问: 具体素材的实际表现数据</span>
        </div>
      </Collapse.Panel>
    </Collapse>
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
          <DeviationBadge level={deviationLevel} />  {/* v2: 偏差分级徽章 */}
        </div>
      </div>
      <div className="trend-chart">
        <ReactECharts option={trendChartOption} />
      </div>
      {/* v2: Spearman ρ 和 Top-K 命中率 */}
      <div className="ranking-metrics">
        <Statistic title="排名相关性 (ρ)" value={spearmanRho} precision={3} />
        <Statistic title="Top-5 命中率" value={topKHitRate} suffix="%" />
      </div>
    </Card>
  );
};
```

---

## 4.3 方案二：爆款公式自动进化（P0）

### 4.3.1 设计理念

将固定的 f1-f7 公式改造为"活公式"，能够根据投放数据自动调整权重和标签组合。

**v2 增强：** 增加影子模式验证、EvolutionSafetyNet、一键回滚。

### 4.3.2 公式数据结构升级

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
  version: 3,
  lastEvolved: '2026-05-28',
  hitRate: 0.72,
  sampleCount: 45,
  confidence: 0.85,
  // v2: 影子模式状态
  shadowMode: {
    active: false,
    candidateVersion: null,
    trials: 0,
    successes: 0,
    target: 10,
  },
  // v2: 信任等级
  trustLevel: 'standard',  // 'conservative' | 'standard' | 'aggressive'
  evidence: [...],
  evolutionLog: [...],
}
```

### 4.3.3 后端实现 — EvolutionSafetyNet（v2 核心新增）

```python
class EvolutionSafetyNet:
    """
    v2: 公式进化安全网

    实现"验证+回滚"双保险：
    1. 回测胜出 → 人工审核 → 影子模式验证 → 确认生效
    2. 表现恶化 → 自动告警 → 一键回滚到任意历史版本
    """

    SHADOW_TARGET = 10       # 影子模式验证次数
    SHADOW_MIN_SUCCESSES = 7 # 最少成功次数

    async def start_shadow_mode(
        self,
        formula_id: str,
        candidate: dict,
        human_approved: bool = False,
    ) -> dict:
        """
        启动影子模式

        流程：
        1. 生成候选公式（已有）
        2. 人工审核闸门（v2 新增）
        3. 影子模式：新旧公式同时预测，静默记录
        4. 验证通过后自动/人工生效
        """
        if not human_approved:
            # 需要人工审核才能进入影子模式
            await notify_human_review(formula_id, candidate)
            return {"status": "pending_review", "candidate": candidate}

        # 创建影子记录
        shadow = {
            "formula_id": formula_id,
            "candidate": candidate,
            "trials": 0,
            "successes": 0,
            "target": self.SHADOW_TARGET,
            "started_at": datetime.now().isoformat(),
        }
        await store_shadow(shadow)
        return {"status": "shadow_started", "shadow": shadow}

    async def record_shadow_trial(
        self,
        formula_id: str,
        old_prediction: Prediction,
        new_prediction: Prediction,
        actual: ActualData,
    ) -> dict:
        """
        记录一次影子模式试验

        判断新公式是否优于旧公式：
        - 排名一致性更高（Spearman ρ）
        - 或绝对误差更小
        """
        shadow = await get_active_shadow(formula_id)
        if not shadow:
            return {"status": "no_active_shadow"}

        # 比较新旧公式
        old_error = abs(old_prediction.predicted_ctr[1] - actual.ctr)
        new_error = abs(new_prediction.predicted_ctr[1] - actual.ctr)
        new_is_better = new_error < old_error

        shadow["trials"] += 1
        if new_is_better:
            shadow["successes"] += 1

        await update_shadow(shadow)

        # 检查是否达到目标
        if shadow["trials"] >= self.SHADOW_TARGET:
            success_rate = shadow["successes"] / shadow["trials"]
            if success_rate >= self.SHADOW_MIN_SUCCESSES / self.SHADOW_TARGET:
                # 验证通过，自动生效
                await self._activate_candidate(formula_id, shadow["candidate"])
                return {
                    "status": "activated",
                    "success_rate": success_rate,
                    "message": f"新公式验证通过（成功率{success_rate:.0%}），已自动生效",
                }
            else:
                # 验证失败，告警
                await self._alert_failure(formula_id, shadow)
                return {
                    "status": "failed",
                    "success_rate": success_rate,
                    "message": f"新公式验证失败（成功率{success_rate:.0%}），建议保留旧公式",
                }

        return {
            "status": "in_progress",
            "progress": f"{shadow['trials']}/{self.SHADOW_TARGET}",
            "success_rate": shadow["successes"] / max(shadow["trials"], 1),
        }

    async def rollback(self, formula_id: str, target_version: int) -> dict:
        """
        v2: 一键回滚到指定版本

        保留完整版本历史，支持回滚到任意历史版本
        """
        formula = await get_formula(formula_id)
        if target_version >= formula["version"]:
            return {"error": "目标版本必须低于当前版本"}

        # 获取历史版本
        history = await get_formula_history(formula_id)
        target = next((h for h in history if h["version"] == target_version), None)

        if not target:
            return {"error": f"版本 {target_version} 不存在"}

        # 执行回滚
        formula["weights"] = target["weights"]
        formula["version"] = formula["version"] + 1  # 版本号递增（但内容回退）
        formula["last_evolved"] = datetime.now().isoformat()
        formula["evolution_log"].append({
            "type": "rollback",
            "from_version": formula["version"] - 1,
            "to_version": target_version,
            "reason": "manual_rollback",
            "timestamp": datetime.now().isoformat(),
        })

        await save_formula(formula)
        return {"status": "rolled_back", "new_version": formula["version"]}


class FormulaManager:
    """爆款公式管理器（v2 增强版）"""

    def __init__(self):
        self.safety_net = EvolutionSafetyNet()

    def get_formulas(self, account_id: str) -> list[dict]:
        """获取账户的所有公式（含健康度 + 影子模式状态）"""
        formulas = self._load_formulas(account_id)
        for f in formulas:
            f['health'] = self._calc_health(f)
            f['shadow'] = self._get_shadow_status(f['id'])
        return formulas

    def _calc_health(self, formula: dict) -> dict:
        """v2: 计算公式健康度（含进化建议）"""
        needs_evolution = self._check_needs_evolution(formula)

        return {
            'hitRate': formula['hitRate'],
            'sampleCount': formula['sampleCount'],
            'confidence': formula['confidence'],
            'lastEvolved': formula['lastEvolved'],
            'needsEvolution': needs_evolution,
            'trustLevel': formula.get('trustLevel', 'standard'),
            'suggestion': self._get_evolution_suggestion(formula, needs_evolution),
        }

    def _get_evolution_suggestion(self, formula: dict, needs: bool) -> Optional[str]:
        """v2: 生成进化建议（人类可读）"""
        if not needs:
            return None
        return (
            f"公式 {formula['name']} 近期预测偏差较大，建议进化。"
            f"点击「生成候选」后需人工审核才能进入影子模式验证。"
        )
```

### 4.3.4 前端界面变化

#### Workshop.tsx — 重构为「公式工作台」（v2 增强）

```typescript
const WorkshopPage = () => {
  const [trustLevel, setTrustLevel] = useState<string>('standard');

  return (
    <div className="workshop">
      {/* v2: 信任等级设置 */}
      <section className="trust-level-setting">
        <h3>⚙️ 进化信任等级</h3>
        <Radio.Group value={trustLevel} onChange={e => setTrustLevel(e.target.value)}>
          <Radio.Button value="conservative">
            <Tooltip title="所有进化都需要人工确认">
              🛡️ 保守模式
            </Tooltip>
          </Radio.Button>
          <Radio.Button value="standard">
            <Tooltip title="小进化自动，大进化需确认">
              ⚖️ 标准模式
            </Tooltip>
          </Radio.Button>
          <Radio.Button value="aggressive">
            <Tooltip title="全自动进化（适合测试账户）">
              🚀 激进模式
            </Tooltip>
          </Radio.Button>
        </Radio.Group>
      </section>

      {/* 公式健康度概览（v2: 含影子模式状态） */}
      <section className="formula-health-overview">
        <h3>📊 公式健康度</h3>
        <div className="health-cards">
          {formulas.map(f => (
            <FormulaHealthCard
              key={f.id}
              formula={f}
              onEvolve={() => handleEvolve(f.id)}
              onRollback={(v) => handleRollback(f.id, v)}  // v2
            />
          ))}
        </div>
      </section>

      {/* v2: 影子模式进行中面板 */}
      <section className="active-shadows">
        <h3>🔬 影子模式进行中</h3>
        {activeShadows.map(s => (
          <ShadowProgressCard
            key={s.formulaId}
            shadow={s}
            onApprove={() => handleActivate(s.formulaId)}
            onReject={() => handleRejectShadow(s.formulaId)}
          />
        ))}
      </section>

      {/* 公式详情 */}
      <section className="formula-details">
        {selectedFormula && (
          <FormulaDetail
            formula={selectedFormula}
            evolutionLog={selectedFormula.evolutionLog}
            onWeightChange={handleWeightChange}
            onRollback={handleRollback}  // v2
          />
        )}
      </section>
    </div>
  );
};

// v2: 公式健康度卡片（含影子模式和回滚）
const FormulaHealthCard = ({ formula, onEvolve, onRollback }) => {
  const healthColor = formula.health.hitRate > 0.7 ? 'green' :
                      formula.health.hitRate > 0.5 ? 'yellow' : 'red';

  return (
    <Card
      title={formula.name}
      extra={
        <Space>
          <Tag color={healthColor}>v{formula.version}</Tag>
          {formula.shadow?.active && <Tag color="blue">🔬 影子验证中</Tag>}
        </Space>
      }
    >
      <div className="health-metrics">
        <div className="metric">
          <span className="label">排名相关性 (ρ)</span>
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
        {/* v2: 信任等级标签 */}
        <div className="metric">
          <span className="label">信任等级</span>
          <Tag>{formula.health.trustLevel}</Tag>
        </div>
      </div>

      {/* v2: 进化建议 */}
      {formula.health.suggestion && (
        <Alert type="warning" message={formula.health.suggestion} showIcon />
      )}

      <div className="actions">
        {formula.health.needsEvolution && (
          <Button type="primary" onClick={onEvolve}>
            🧬 生成候选公式
          </Button>
        )}
        {/* v2: 一键回滚 */}
        <Dropdown
          menu={{
            items: formula.evolutionLog
              .filter(log => log.type !== 'rollback')
              .map(log => ({
                key: log.version,
                label: `回滚到 v${log.version} (${log.date})`,
              })),
            onClick: ({ key }) => onRollback(parseInt(key)),
          }}
        >
          <Button>⏪ 回滚</Button>
        </Dropdown>
      </div>
    </Card>
  );
};

// v2: 影子模式进度卡片
const ShadowProgressCard = ({ shadow, onApprove, onReject }) => {
  const progress = (shadow.trials / shadow.target) * 100;
  const successRate = shadow.trials > 0 ? shadow.successes / shadow.trials : 0;

  return (
    <Card size="small" title={`公式 ${shadow.formulaName} 影子验证`}>
      <Progress percent={progress} format={() => `${shadow.trials}/${shadow.target}`} />
      <div className="success-rate">
        成功率: <Tag color={successRate >= 0.7 ? 'green' : 'red'}>{(successRate * 100).toFixed(0)}%</Tag>
      </div>
      {shadow.trials >= shadow.target && (
        <Space>
          <Button type="primary" onClick={onApprove}>✅ 确认生效</Button>
          <Button danger onClick={onReject}>❌ 拒绝</Button>
        </Space>
      )}
    </Card>
  );
};
```

---

## 4.4 方案三：盲预测隔离机制（P1）

### 4.4.1 设计理念

借鉴 Cheat-on-Content 的"盲子代理"概念，在预测时隔离实际数据，保证预测的客观性。

**v2 增强：** 明确数据边界、BlindnessGuard 审计、自动降级策略。

### 4.4.2 实现方式（v2 增强）

```python
class BlindnessGuard:
    """
    v2: 盲隔离守卫

    职责：
    1. 定义允许/禁止访问的数据边界
    2. 审计每次预测的数据访问
    3. 样本不足时自动降级为"参考预测"
    """

    # v2: 明确的数据访问边界
    ALLOWED_ACCESS = [
        "tags",                    # 素材标签
        "duration",                # 时长
        "style",                   # 风格
        "genre",                   # 游戏品类
        "has_voiceover",           # 是否有配音
        "aggregated_stats",        # ≥5个样本的聚合统计
    ]

    BLOCKED_ACCESS = [
        "actual_ctr",              # 具体素材的实际CTR
        "actual_roas",             # 具体素材的实际ROAS
        "actual_cvr",              # 具体素材的实际CVR
        "spend_details",           # 花费明细
        "launch_time",             # 投放时间
        "specific_creative_performance",  # 具体素材表现
    ]

    MIN_SAMPLES_FOR_AGGREGATE = 5  # 聚合统计最低样本量

    def check_access(self, requested_data: list[str]) -> tuple[bool, list[str]]:
        """
        检查数据访问请求是否合规

        Returns: (是否合规, 违规项列表)
        """
        violations = [d for d in requested_data if d in self.BLOCKED_ACCESS]
        return len(violations) == 0, violations

    def get_aggregate_stats(self, tags: list[str], account_id: str) -> dict:
        """
        v2: 获取聚合统计（安全版本）

        只有当样本量 ≥ 5 时才返回，否则返回降级提示
        """
        count = self._count_matching_samples(tags, account_id)

        if count < self.MIN_SAMPLES_FOR_AGGREGATE:
            return {
                "degraded": True,
                "reason": f"样本量不足（{count} < {self.MIN_SAMPLES_FOR_AGGREGATE}）",
                "suggestion": "自动切换为参考预测模式",
                "sample_count": count,
            }

        # 返回脱敏的聚合统计
        stats = self._query_aggregate(tags, account_id)
        return {
            "degraded": False,
            "sample_count": count,
            "ctr_p25": stats["ctr_p25"],
            "ctr_p75": stats["ctr_p75"],
            "roas_p25": stats["roas_p25"],
            "roas_p75": stats["roas_p75"],
        }

    def audit_prediction(self, prediction: Prediction) -> dict:
        """
        v2: 审计预测的数据访问

        返回审计报告，供前端展示
        """
        return {
            "prediction_id": prediction.id,
            "mode": prediction.mode.value,
            "accessed": prediction.data_access_log,
            "blocked": self.BLOCKED_ACCESS,
            "compliant": self.check_access(prediction.data_access_log)[0],
            "degraded": prediction.uncertainty.total > 0.5,
        }


class BlindPredictor:
    """盲预测器（v2 增强版）"""

    def __init__(self):
        self.guard = BlindnessGuard()

    def predict(self, creative_features: dict, account_id: str) -> Prediction:
        """
        v2 增强盲预测：
        - 明确数据边界
        - 自动降级策略
        - 完整审计日志
        """
        access_log = []

        # v2: 检查数据访问合规性
        requested = list(creative_features.keys())
        is_compliant, violations = self.guard.check_access(requested)
        if not is_compliant:
            raise BlindnessViolationError(
                f"盲预测不允许访问以下数据: {violations}"
            )

        # v2: 获取聚合统计（含降级判断）
        tags = creative_features.get('tags', [])
        agg_stats = self.guard.get_aggregate_stats(tags, account_id)

        if agg_stats['degraded']:
            # v2: 自动降级为参考预测
            access_log.append(f"降级: {agg_stats['reason']}")
            return self._generate_degraded_prediction(
                creative_features, agg_stats, access_log
            )

        access_log.append(f"聚合统计: {agg_stats['sample_count']}个样本")

        # 正常盲预测
        prediction = Prediction(
            creative_id=creative_features['id'],
            predicted_ctr=(agg_stats['ctr_p25'], agg_stats['ctr_p75']),
            predicted_cvr=(0.0, 0.0),
            predicted_roas=(agg_stats['roas_p25'], agg_stats['roas_p75']),
            confidence=max(0.3, 1.0 - 0.5 * (1.0 / max(agg_stats['sample_count'], 1))),
            uncertainty=Uncertainty(
                total=0.3,
                sources={UncertaintySource.DATA: 0.2, UncertaintySource.MODEL: 0.05, UncertaintySource.ENVIRONMENT: 0.05},
                explanation="盲预测模式，基于聚合统计",
            ),
            mode=PredictionMode.BLIND,
            data_access_log=access_log,
            evidence=[f"基于 {agg_stats['sample_count']} 个相似素材的聚合统计"],
            created_at=datetime.now().isoformat(),
        )

        # v2: 审计
        audit = self.guard.audit_prediction(prediction)
        prediction.audit_report = audit

        return prediction

    def _generate_degraded_prediction(self, features, stats, access_log) -> Prediction:
        """v2: 生成降级预测"""
        access_log.append("已降级为参考预测，置信度已降低")
        return Prediction(
            creative_id=features['id'],
            predicted_ctr=(0.01, 0.05),  # 宽区间
            predicted_cvr=(0.0, 0.0),
            predicted_roas=(0.5, 2.0),   # 宽区间
            confidence=0.2,
            uncertainty=Uncertainty(
                total=0.7,
                sources={UncertaintySource.DATA: 0.5, UncertaintySource.MODEL: 0.1, UncertaintySource.ENVIRONMENT: 0.1},
                explanation="样本不足，已降级为参考预测，准确度有限",
            ),
            mode=PredictionMode.INFORMED,  # 降级为参考模式
            data_access_log=access_log,
            evidence=["样本不足，参考预测"],
            created_at=datetime.now().isoformat(),
        )
```

### 4.4.3 前端交互设计（v2 增强）

```typescript
// v2: 预测模式切换（含降级提示）
const PredictionModeToggle = () => {
  const [mode, setMode] = useState<'blind' | 'informed'>('blind');
  const [isDegraded, setIsDegraded] = useState(false);

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

      {/* v2: 降级提示 */}
      {isDegraded && (
        <Alert
          type="warning"
          message="样本不足，已自动降级为参考预测"
          description="当相似素材少于5个时，系统会自动降低预测置信度"
          showIcon
        />
      )}

      {mode === 'blind' && !isDegraded && (
        <Alert
          type="info"
          message="盲预测模式：AI只能看到素材特征，无法访问实际投放数据"
        />
      )}
    </div>
  );
};

// v2: 数据访问清单（盲隔离透明化）
const DataAccessLog = ({ prediction }) => {
  return (
    <Collapse size="small">
      <Collapse.Panel
        header={
          <Space>
            <span>📋 数据访问清单</span>
            <Tag color={prediction.auditReport?.compliant ? 'green' : 'red'}>
              {prediction.auditReport?.compliant ? '合规' : '异常'}
            </Tag>
          </Space>
        }
        key="1"
      >
        <div className="access-section">
          <h4>✅ 已访问</h4>
          {prediction.dataAccessLog.map((log, i) => (
            <div key={i} className="log-entry allowed">
              <CheckCircleOutlined />
              <span>{log}</span>
            </div>
          ))}
        </div>
        <div className="access-section">
          <h4>🚫 未访问（盲隔离）</h4>
          {BLIND_BLOCKED_FIELDS.map((field, i) => (
            <div key={i} className="log-entry blocked">
              <CloseCircleOutlined />
              <span>{field}</span>
            </div>
          ))}
        </div>
      </Collapse.Panel>
    </Collapse>
  );
};
```

---

## 4.5 方案四：个人评分体系（P1）

### 4.5.1 设计理念

从"通用标签+固定公式"升级为"从你的历史数据推导个性化评分标准"。

**v2 增强：** 冷启动三阶段降级 + 人工微调锁定。

### 4.5.2 后端实现（v2 增强）

```python
class PersonalRubric:
    """个人评分体系（v2 增强版）"""

    # v2: 三阶段个性化权重
    STAGES = {
        'cold_start': {'min_samples': 0, 'industry_weight': 1.0},
        'hybrid': {'min_samples': 20, 'industry_weight': 'dynamic'},
        'personalized': {'min_samples': 100, 'industry_weight': 0.0},
    }

    def derive_from_history(self, account_id: str) -> dict:
        """
        v2 增强：从账户历史数据推导个性化评分体系

        三阶段降级：
        - 阶段一（0-20条）：行业先验 100%
        - 阶段二（20-100条）：行业先验 + 账户数据混合
        - 阶段三（100+条）：账户数据 100%
        """
        sample_count = self._get_sample_count(account_id)

        # v2: 确定阶段
        if sample_count < 20:
            stage = 'cold_start'
            dimensions = self._get_industry_dimensions()
            dimensions_source = 'industry'
        elif sample_count < 100:
            stage = 'hybrid'
            alpha = sample_count / 100
            industry_dims = self._get_industry_dimensions()
            account_dims = self._derive_account_dimensions(account_id)
            dimensions = self._merge_dimensions(industry_dims, account_dims, alpha)
            dimensions_source = f'hybrid(alpha={alpha:.2f})'
        else:
            stage = 'personalized'
            dimensions = self._derive_account_dimensions(account_id)
            dimensions_source = 'account'

        # v2: 人工微调支持
        manual_overrides = self._get_manual_overrides(account_id)
        if manual_overrides:
            dimensions = self._apply_overrides(dimensions, manual_overrides)

        return {
            'stage': stage,
            'sample_count': sample_count,
            'dimensions_source': dimensions_source,
            'dimensions': dimensions,
            'manual_overrides': manual_overrides,
            'generated_at': datetime.now().isoformat(),
        }

    def lock_dimension(self, account_id: str, dimension_name: str, weight: float) -> dict:
        """
        v2: 人工锁定维度权重

        被锁定的维度不会被算法自动调整
        """
        self._save_manual_override(account_id, dimension_name, weight)
        return {
            'dimension': dimension_name,
            'weight': weight,
            'locked': True,
            'message': f"维度「{dimension_name}」已锁定为 {weight}，算法不会自动调整",
        }

    def _derive_account_dimensions(self, account_id: str) -> list[dict]:
        """从账户数据推导维度"""
        top_creatives = self._get_top_creatives(account_id, metric='roas', top_n=20)
        common_patterns = self._analyze_patterns(top_creatives)
        return self._generate_dimensions(common_patterns)

    def _merge_dimensions(self, industry: list, account: list, alpha: float) -> list:
        """v2: 混合维度（行业先验 + 账户数据）"""
        merged = {}
        for dim in industry:
            merged[dim['name']] = {
                **dim,
                'weight': dim['weight'] * (1 - alpha),
                'source': 'industry',
            }
        for dim in account:
            if dim['name'] in merged:
                merged[dim['name']]['weight'] += dim['weight'] * alpha
                merged[dim['name']]['source'] = 'hybrid'
            else:
                merged[dim['name']] = {
                    **dim,
                    'weight': dim['weight'] * alpha,
                    'source': 'account',
                }
        return list(merged.values())
```

### 4.5.3 前端界面变化（v2 增强）

```typescript
const PersonalTrendTab = () => {
  return (
    <div className="personal-trends">
      {/* v2: 冷启动阶段提示 */}
      {stage !== 'personalized' && (
        <Alert
          type={stage === 'cold_start' ? 'warning' : 'info'}
          message={
            stage === 'cold_start'
              ? `冷启动阶段（${sampleCount}/20条），当前使用行业基准维度`
              : `数据积累中（${sampleCount}/100条），行业先验权重${Math.round((1 - sampleCount/100) * 100)}%`
          }
          showIcon
        />
      )}

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
              {/* v2: 维度来源标签 */}
              <Tag color={
                d.source === 'industry' ? 'blue' :
                d.source === 'hybrid' ? 'purple' : 'green'
              }>
                {d.source === 'industry' ? '行业基准' :
                 d.source === 'hybrid' ? '混合' : '你的数据'}
              </Tag>
              {/* v2: 人工锁定按钮 */}
              <Button
                size="small"
                type={d.locked ? 'primary' : 'default'}
                onClick={() => handleLockDimension(d.name)}
              >
                {d.locked ? '🔒 已锁定' : '🔓 锁定'}
              </Button>
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

**v2 增强：** 行业基准库（从竞品爬虫数据构建）。

### 4.6.2 后端实现（v2 增强）

```python
class BenchmarkComparator:
    """基准对比器（v2 增强版）"""

    def compare(self, account_id: str, benchmark_id: str) -> dict:
        """对比当前账户与基准账户"""
        current = self._get_account_stats(account_id)
        benchmark = self._get_account_stats(benchmark_id)

        return {
            'metrics_comparison': self._compare_metrics(current, benchmark),
            'creative_diversity': self._calc_diversity(account_id),
            'recommendations': self._generate_recommendations(current, benchmark),
        }

    def get_industry_benchmark(self, genre: str) -> dict:
        """
        v2: 从竞品爬虫数据构建行业基准库

        数据来源：
        - PlatformData 模块爬取的竞品投放数据
        - 按游戏品类分层
        - 月度更新
        """
        benchmarks = self._load_industry_benchmarks(genre)
        return {
            'genre': genre,
            'sample_accounts': benchmarks['sample_count'],
            'metrics': {
                'ctr_p50': benchmarks['ctr_median'],
                'roas_p50': benchmarks['roas_median'],
                'cpi_p50': benchmarks['cpi_median'],
            },
            'last_updated': benchmarks['updated_at'],
        }
```

### 4.6.3 前端界面变化

```typescript
const BenchmarkComparison = () => {
  return (
    <div className="benchmark-comparison">
      <h3>📊 你 vs 竞品对比</h3>

      {/* v2: 行业基准选择 */}
      <Select placeholder="选择游戏品类" onChange={handleGenreChange}>
        <Option value="SLG">SLG</Option>
        <Option value="RPG">RPG</Option>
        <Option value="休闲">休闲</Option>
        <Option value="竞技">竞技</Option>
      </Select>

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

## 4.7 横切关注点（v2 核心新增）

### 4.7.1 冷启动降级策略

**覆盖方案：** 一、二、三、四

```
┌─────────────────────────────────────────────────────────────┐
│                    冷启动三阶段降级                           │
├─────────────┬───────────────┬───────────────────────────────┤
│   阶段一     │    阶段二      │          阶段三               │
│  0-20 条     │   20-100 条    │         100+ 条              │
├─────────────┼───────────────┼───────────────────────────────┤
│ 行业先验100% │ 混合权重       │ 账户数据100%                  │
│ 标注"冷启动" │ alpha=n/100   │ 完全个性化                    │
│ 置信度≤0.3  │ 置信度0.3-0.7 │ 置信度≥0.7                   │
│ 宽预测区间   │ 逐步收窄       │ 精准区间                      │
└─────────────┴───────────────┴───────────────────────────────┘
```

**行业基准数据来源：**
- 复用现有竞品爬虫（PlatformData 模块）
- 按游戏品类（SLG/RPG/休闲/竞技）分层
- 月度自动更新

### 4.7.2 不确定度分解

**覆盖方案：** 一、三

```
总不确定度 = 数据不确定度 + 模型不确定度 + 环境不确定度
             ↓                ↓                ↓
         样本量不足        公式版本太新       节假日/竞品冲击
         相似素材偏少      预测次数不足       市场波动大
```

**前端展示：**
- 不确定度进度条（颜色编码：绿/黄/红）
- 各来源分量 Tag 展示
- 人类可读解释文本

**决策指导：**
| 不确定度水平 | 建议 |
|-------------|------|
| < 0.3 | 可信赖，建议执行 |
| 0.3 - 0.5 | 参考价值，建议人工确认 |
| > 0.5 | 不确定度高，仅供参考 |

### 4.7.3 人机协作闸门

**覆盖方案：** 一、二、四

```
┌─────────────────────────────────────────────────────────────┐
│                    人机协作决策点                             │
├──────────────────────┬──────────────┬───────────────────────┤
│       决策点          │  算法角色     │      人工角色          │
├──────────────────────┼──────────────┼───────────────────────┤
│ 公式进化              │ 生成候选方案  │ 审核确认后进入影子模式  │
│ 影子模式完成          │ 评估验证结果  │ 确认生效或拒绝          │
│ 个性化权重            │ 推导初始权重  │ 可微调并锁定            │
│ 复盘异常点            │ 自动识别      │ 人工复核剔除            │
│ 一键回滚              │ 执行回滚      │ 选择目标版本            │
└──────────────────────┴──────────────┴───────────────────────┘
```

**信任等级设置：**

| 模式 | 公式进化 | 权重调整 | 适用场景 |
|------|---------|---------|---------|
| 🛡️ 保守 | 全部需确认 | 全部需确认 | 核心账户、大预算 |
| ⚖️ 标准 | 小自动/大需确认 | 可自动 | 日常运营 |
| 🚀 激进 | 全自动 | 全自动 | 测试账户、小预算 |

### 4.7.4 业务指标重定义

**覆盖方案：** 全部

| 指标 | v1 定义 | v2 定义 | 重定义原因 |
|------|---------|---------|-----------|
| **核心预测指标** | 预测准确率 > 70% | Spearman ρ > 0.6 | 买量决策关心排名而非绝对值 |
| **排名命中率** | 无 | Top-5 命中率 > 60% | 直接对应"先跑哪5个素材"决策 |
| **ROAS误差** | 绝对误差 < 20% | 中位数误差 < 15% | 中位数对异常值更鲁棒 |
| **进化成功率** | 准确率提升比例 | Spearman ρ 提升比例 | 与核心指标对齐 |
| **用户采纳** | 使用预测功能率 | 预测后实际执行率 | 从"用了"到"信了" |
| **闭环完成率** | 有预测的素材完成复盘比例 | 同左 + 异常清洗后有效复盘率 | 排除噪音数据 |

---

## 4.8 管理者模式同步改动（v2 核心新增）

> **设计原则：** 标准模式是**素材级**视角（单人/单素材深度分析），管理者模式是**设计师级**视角（团队横向对比+排名）。所有标准模式的改动都必须映射到管理者模式的对应页面，但以"团队聚合"的形式呈现。

### 4.8.1 管理者模式数据架构

#### 数据流

```
Excel导入(含designer/media列)
    ↓
useManagerDataStore
    ↓
deriveDesigners(data) — 按 designer 字段分组
    ↓
computeDesignerStats(name, materials[]) — 计算约50个字段
    ↓
DesignerStats[] — 按 totalSpend 降序排列
    ↓
各管理者页面消费
```

#### DesignerStats 接口扩展（v2 新增字段）

```typescript
interface DesignerStats {
  // ═══ 现有约50个字段 ═══
  materialCount: number;
  totalSpend: number;
  avgCtr: number;
  avgCpm: number;
  avgCpc: number;
  efficiencyScore: number;        // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  grade: 'S' | 'A' | 'B' | 'C';
  // ... 其他现有字段 ...

  // ═══ v2 新增：预测-复盘相关字段 ═══
  spearmanRho: number | null;           // 预测排名相关性
  topKHitRate: number | null;           // Top-5 命中率 (%)
  medianError: number | null;           // 中位数误差 (%)
  retroCompletionRate: number;          // 闭环完成率 (%)
  evolutionContribution: number;        // 公式进化贡献次数
  predictionLabel: string;              // 预测能力标签
  recentRetros: RetroSummary[];         // 近期复盘记录摘要
  activeShadows: ShadowSummary[];       // 活跃影子模式

  // ═══ v2 新增：冷启动阶段 ═══
  coldStartStage: 1 | 2 | 3;           // 冷启动阶段
  sampleCount: number;                  // 历史素材样本量
}

interface RetroSummary {
  creativeName: string;
  predictedCtr: string;
  actualCtr: string;
  deviationLevel: 'normal' | 'moderate' | 'severe';
  direction: 'over' | 'under' | 'accurate';
}

interface ShadowSummary {
  formulaName: string;
  trials: number;
  target: number;
  successRate: number;
}
```

### 4.8.2 标准模式 ↔ 管理者模式改动映射

| 标准模式页面 | 改动内容 | 管理者模式页面 | 对应改动 | 视角差异 |
|-------------|---------|---------------|---------|---------|
| Dashboard | 「预测vs实际」卡片 | **ManagerDashboard** | 「团队预测健康度」汇总 | 单素材 → 团队汇总 |
| CreativeInsightNew | 「预测实验室」Tab | **ManagerCreativeInsight** | 「团队预测对比」图表 | 单人预测 → 设计师间排名 |
| Workshop | 「公式工作台」 | **ManagerDataDiagnosis** | 第七章「公式健康度团队视图」 | 单公式 → 团队公式全景 |
| Reports | 指标重定义 | **ManagerReports** | 团队级指标 + 散点图 | 个人指标 → 团队排名 |
| 盲预测审计 | 数据访问清单 | **ManagerDataDiagnosis** | 设计师预测能力排名 | 单次审计 → 团队审计汇总 |
| 影子模式 | 进度监控面板 | **ManagerDashboard** | 活跃影子模式计数 | 单公式 → 团队影子全景 |

### 4.8.3 ManagerDashboard 改动

**对应标准模式改动：** Dashboard「预测vs实际」卡片

#### 新增全局汇总统计卡片

在现有4列基础上扩展为6列：

```typescript
const summaryCards = [
  // ═══ 现有4个 ═══
  { title: '设计师数', value: designers.length },
  { title: '总花费', value: `$${totalSpend.toLocaleString()}` },
  { title: '总素材数', value: totalMaterials },
  { title: '高风险设计师', value: highRiskCount, color: 'red' },

  // ═══ v2 新增2个 ═══
  {
    title: '团队预测准确率',
    value: teamSpearmanRho?.toFixed(3) ?? 'N/A',
    suffix: 'ρ',
    color: teamSpearmanRho > 0.6 ? '#52c41a' : '#ff4d4f',
  },
  {
    title: '闭环完成率',
    value: `${teamRetroCompletionRate}%`,
    color: teamRetroCompletionRate > 80 ? '#52c41a' : '#faad14',
  },
];
```

#### 新增图表：设计师预测排名相关性对比

```typescript
// 在现有4张图表的2x2网格中，新增第5张（调整为2x3或3x2布局）
const designerSpearmanChart = {
  title: '设计师预测排名相关性 (ρ)',
  tooltip: 'ρ > 0.6 为合格，ρ > 0.7 为优秀',
  xAxis: designers.map(d => d.name),
  yAxis: { name: 'Spearman ρ', min: 0, max: 1 },
  series: [{
    type: 'bar',
    data: designers.map(d => ({
      value: d.spearmanRho ?? 0,
      itemStyle: {
        color: d.spearmanRho > 0.7 ? '#52c41a' :
               d.spearmanRho > 0.6 ? '#faad14' : '#ff4d4f',
      },
    })),
  }],
  markLine: {
    data: [{ yAxis: 0.6, label: '合格线', lineStyle: { color: '#faad14', type: 'dashed' } }],
  },
};
```

#### DesignerCard 新增 section：预测表现

```typescript
const getCardSections = (designer: DesignerStats): CardSection[] => [
  // ═══ 现有4个 section ═══
  { title: '📊 核心指标', content: <CoreMetricsSection /> },
  { title: '🔥 TOP3花费素材', content: <TopMaterialsSection /> },
  { title: '❄️ BOTTOM3花费素材', content: <BottomMaterialsSection /> },
  { title: '📺 渠道分布', content: <ChannelSection /> },

  // ═══ v2 新增第5个 section ═══
  {
    title: '🎯 预测表现',
    content: (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Tag color={designer.spearmanRho > 0.6 ? 'green' : 'red'}>
          ρ = {designer.spearmanRho?.toFixed(3) ?? 'N/A'}
        </Tag>
        <Tag color={designer.retroCompletionRate > 80 ? 'green' : 'orange'}>
          闭环率 {designer.retroCompletionRate}%
        </Tag>
        <Tag color={designer.coldStartStage === 3 ? 'blue' : 'gold'}>
          {designer.coldStartStage === 1 ? '冷启动' :
           designer.coldStartStage === 2 ? '数据积累中' : '个性化'}
        </Tag>
        {designer.activeShadows.length > 0 && (
          <Tag color="purple">🔬 {designer.activeShadows.length}个影子验证中</Tag>
        )}
      </div>
    ),
  },
];
```

#### DesignerDetailModal 新增 section

```typescript
const getModalSections = (designer: DesignerStats): DetailSection[] => [
  // ═══ 现有6个 section ═══
  // ...

  // ═══ v2 新增第7个 section ═══
  {
    title: '🎯 预测-复盘详情',
    content: (
      <>
        <Descriptions column={4} bordered size="small">
          <Descriptions.Item label="排名相关性 (ρ)">
            <Tag color={designer.spearmanRho > 0.6 ? 'green' : 'red'}>
              {designer.spearmanRho?.toFixed(3) ?? 'N/A'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Top-5 命中率">{designer.topKHitRate ?? 'N/A'}%</Descriptions.Item>
          <Descriptions.Item label="中位数误差">{designer.medianError ?? 'N/A'}%</Descriptions.Item>
          <Descriptions.Item label="闭环完成率">{designer.retroCompletionRate}%</Descriptions.Item>
          <Descriptions.Item label="冷启动阶段">
            阶段{designer.coldStartStage}（{designer.sampleCount}条数据）
          </Descriptions.Item>
          <Descriptions.Item label="公式进化贡献">{designer.evolutionContribution}次</Descriptions.Item>
        </Descriptions>

        <Divider>近期复盘记录</Divider>
        <Table
          size="small"
          pagination={{ pageSize: 5 }}
          columns={[
            { title: '素材', dataIndex: 'creativeName', ellipsis: true },
            { title: '预测CTR', dataIndex: 'predictedCtr' },
            { title: '实际CTR', dataIndex: 'actualCtr' },
            {
              title: '偏差等级',
              dataIndex: 'deviationLevel',
              render: (level: string) => (
                <Tag color={level === 'normal' ? 'green' : level === 'moderate' ? 'orange' : 'red'}>
                  {level === 'normal' ? '正常' : level === 'moderate' ? '中等' : '严重'}
                </Tag>
              ),
            },
            {
              title: '方向',
              dataIndex: 'direction',
              render: (dir: string) => dir === 'over' ? '高估' : dir === 'under' ? '低估' : '准确',
            },
          ]}
          dataSource={designer.recentRetros}
        />
      </>
    ),
  },
];
```

#### 管理者反馈面板扩展

```typescript
// 在现有反馈规则基础上新增预测相关规则
const getFeedback = (designer: DesignerStats, allDesigners: DesignerStats[]) => {
  const feedback = { strengths: [], weaknesses: [], suggestions: [] };

  // ═══ 现有规则 ═══
  // ...

  // ═══ v2 新增：预测相关规则 ═══
  if (designer.spearmanRho !== null) {
    if (designer.spearmanRho > 0.7) {
      feedback.strengths.push('预测能力强，排名相关性优秀');
    } else if (designer.spearmanRho < 0.4) {
      feedback.weaknesses.push('预测能力不足，素材表现难以预判');
      feedback.suggestions.push('建议增加素材多样性，积累更多投放数据以提升预测精度');
    }
  }

  if (designer.retroCompletionRate < 50) {
    feedback.weaknesses.push('闭环完成率低，复盘数据不足');
    feedback.suggestions.push('确保所有投放素材都完成T+3复盘');
  }

  if (designer.activeShadows.length > 0) {
    feedback.suggestions.push(`有${designer.activeShadows.length}个公式正在影子模式验证中`);
  }

  return feedback;
};
```

### 4.8.4 ManagerCreativeInsight 改动

**对应标准模式改动：** CreativeInsightNew「预测实验室」Tab

#### 新增图表：设计师预测排名对比

```typescript
// 在现有4张图表基础上新增第5张
const designerPredictionChart = {
  title: '设计师预测排名相关性 (ρ)',
  tooltip: '衡量设计师对素材表现的预判能力',
  xAxis: designers.map(d => d.name),
  yAxis: { name: 'Spearman ρ', min: 0, max: 1 },
  series: [{
    type: 'bar',
    data: designers.map(d => ({
      value: d.spearmanRho ?? 0,
      itemStyle: {
        color: d.spearmanRho > 0.7 ? '#722ed1' :
               d.spearmanRho > 0.6 ? '#b37feb' : '#d3adf7',
      },
    })),
  }],
};
```

#### DesignerDetailModal 新增 section

```typescript
const getModalSections = (designer: DesignerStats): DetailSection[] => [
  // ═══ 现有5个 section ═══
  // ...

  // ═══ v2 新增第6个 section ═══
  {
    title: '🎯 预测-复盘详情',
    content: (
      <>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="排名相关性 (ρ)">{designer.spearmanRho?.toFixed(3) ?? 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Top-5 命中率">{designer.topKHitRate ?? 'N/A'}%</Descriptions.Item>
          <Descriptions.Item label="中位数误差">{designer.medianError ?? 'N/A'}%</Descriptions.Item>
          <Descriptions.Item label="闭环完成率">{designer.retroCompletionRate}%</Descriptions.Item>
          <Descriptions.Item label="冷启动阶段">阶段{designer.coldStartStage}</Descriptions.Item>
          <Descriptions.Item label="公式进化贡献">{designer.evolutionContribution}次</Descriptions.Item>
        </Descriptions>

        <Divider>近期复盘记录</Divider>
        <Table
          size="small"
          pagination={{ pageSize: 5 }}
          columns={[
            { title: '素材', dataIndex: 'creativeName', ellipsis: true },
            { title: '预测CTR', dataIndex: 'predictedCtr' },
            { title: '实际CTR', dataIndex: 'actualCtr' },
            {
              title: '偏差等级',
              dataIndex: 'deviationLevel',
              render: (level: string) => (
                <Tag color={level === 'normal' ? 'green' : level === 'moderate' ? 'orange' : 'red'}>
                  {level === 'normal' ? '正常' : level === 'moderate' ? '中等' : '严重'}
                </Tag>
              ),
            },
          ]}
          dataSource={designer.recentRetros}
        />
      </>
    ),
  },
];
```

### 4.8.5 ManagerDataDiagnosis 改动（最重要）

**对应标准模式改动：** Workshop「公式工作台」+ 预测-复盘闭环核心

> ManagerDataDiagnosis 是整个管理者模式的"算法引擎"（`generateDesignerAnalysis` 约190行），其六章结构构成了完整的管理决策闭环。v2 在此基础上新增**第七章：预测-复盘闭环健康度**。

#### 新增第七章：预测-复盘闭环健康度

```typescript
// 在现有六章基础上新增
const chapter7 = {
  title: '七、预测-复盘闭环健康度',
  sections: [
    // ─── 7.1 团队预测能力总览 ───
    {
      title: '7.1 团队预测能力总览',
      content: (
        <Descriptions column={3} bordered>
          <Descriptions.Item label="团队 Spearman ρ">
            <Tag color={teamSpearmanRho > 0.6 ? 'green' : 'red'} style={{ fontSize: 16 }}>
              {teamSpearmanRho?.toFixed(3) ?? 'N/A'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="团队 Top-5 命中率">{teamTopKHitRate}%</Descriptions.Item>
          <Descriptions.Item label="团队中位数误差">{teamMedianError}%</Descriptions.Item>
          <Descriptions.Item label="闭环完成率">{teamRetroCompletionRate}%</Descriptions.Item>
          <Descriptions.Item label="活跃影子模式">{activeShadowCount}个</Descriptions.Item>
          <Descriptions.Item label="待进化公式">{pendingEvolutionCount}个</Descriptions.Item>
        </Descriptions>
      ),
    },

    // ─── 7.2 设计师预测能力排名 ───
    {
      title: '7.2 设计师预测能力排名',
      content: (
        <>
          <Table
            columns={[
              { title: '排名', render: (_, __, i) => i + 1, width: 60 },
              { title: '设计师', dataIndex: 'name' },
              {
                title: 'Spearman ρ',
                dataIndex: 'spearmanRho',
                render: v => <Tag color={v > 0.7 ? 'green' : v > 0.6 ? 'orange' : 'red'}>{v?.toFixed(3) ?? 'N/A'}</Tag>,
                sorter: (a, b) => (a.spearmanRho ?? 0) - (b.spearmanRho ?? 0),
              },
              {
                title: 'Top-5 命中率',
                dataIndex: 'topKHitRate',
                render: v => `${v ?? 'N/A'}%`,
                sorter: (a, b) => (a.topKHitRate ?? 0) - (b.topKHitRate ?? 0),
              },
              {
                title: '闭环完成率',
                dataIndex: 'retroCompletionRate',
                render: v => <Progress percent={v} size="small" status={v > 80 ? 'success' : 'active'} />,
              },
              { title: '进化贡献', dataIndex: 'evolutionContribution' },
              {
                title: '标签',
                dataIndex: 'predictionLabel',
                render: v => <Tag>{v}</Tag>,
              },
            ]}
            dataSource={designerPredictionRanking}
            pagination={false}
          />
        </>
      ),
    },

    // ─── 7.3 公式健康度团队视图 ───
    {
      title: '7.3 公式健康度团队视图',
      content: (
        <Table
          columns={[
            { title: '公式', dataIndex: 'formulaName' },
            {
              title: '团队命中率',
              dataIndex: 'teamHitRate',
              render: v => (
                <Progress
                  percent={Math.round(v * 100)}
                  status={v > 0.7 ? 'success' : v > 0.5 ? 'active' : 'exception'}
                />
              ),
            },
            { title: '版本', dataIndex: 'version' },
            {
              title: '影子模式',
              dataIndex: 'shadowActive',
              render: v => v
                ? <Tag color="blue">🔬 验证中 ({v.trials}/{v.target})</Tag>
                : <Tag>正常</Tag>,
            },
            {
              title: '建议',
              dataIndex: 'suggestion',
              render: v => v ? <Alert type="warning" message={v} banner /> : <Tag color="green">健康</Tag>,
            },
          ]}
          dataSource={formulaHealthOverview}
        />
      ),
    },

    // ─── 7.4 团队冷启动状态 ───
    {
      title: '7.4 团队冷启动状态',
      content: (
        <div>
          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="阶段一（冷启动）"
                  value={designers.filter(d => d.coldStartStage === 1).length}
                  suffix="人"
                  valueStyle={{ color: '#faad14' }}
                />
                <div>行业基准预测，准确度有限</div>
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="阶段二（数据积累）"
                  value={designers.filter(d => d.coldStartStage === 2).length}
                  suffix="人"
                  valueStyle={{ color: '#1890ff' }}
                />
                <div>行业先验 + 账户数据混合</div>
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="阶段三（个性化）"
                  value={designers.filter(d => d.coldStartStage === 3).length}
                  suffix="人"
                  valueStyle={{ color: '#52c41a' }}
                />
                <div>完全个性化预测</div>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
  ],
};
```

#### generateDesignerAnalysis 函数扩展

```typescript
// 在现有7个分析维度基础上新增第8个维度
function generateDesignerAnalysis(
  designer: DesignerStats,
  allDesigners: DesignerStats[],
): DesignerAnalysis {
  // ═══ 现有7个分析维度 ═══
  // 1. CPC效率分析
  // 2. CTR质量分析
  // 3. 体量与花费效率
  // 4. 渠道特异性分析
  // 5. 视频播放率分析
  // 6. 素材类型混合分析
  // 7. 异常与风险
  // ... (现有代码保持不变)

  // ═══ v2 新增第8个维度：预测能力分析 ═══
  const predictionAnalysis = {
    strengths: [] as string[],
    weaknesses: [] as string[],
    shortTerm: [] as string[],
    longTerm: [] as string[],
  };

  // Spearman ρ 分析
  if (designer.spearmanRho !== null) {
    if (designer.spearmanRho > 0.7) {
      predictionAnalysis.strengths.push(
        `预测能力优秀（ρ=${designer.spearmanRho.toFixed(3)}），素材表现可预判性强`
      );
    } else if (designer.spearmanRho > 0.5) {
      predictionAnalysis.strengths.push(
        `预测能力中等（ρ=${designer.spearmanRho.toFixed(3)}），仍有提升空间`
      );
    } else {
      predictionAnalysis.weaknesses.push(
        `预测能力不足（ρ=${designer.spearmanRho.toFixed(3)}），素材表现难以预判`
      );
      predictionAnalysis.shortTerm.push('回顾近期预测偏差较大的素材，分析偏差原因');
      predictionAnalysis.longTerm.push('增加素材类型多样性，积累更多投放数据以提升预测精度');
    }
  }

  // 闭环完成率分析
  if (designer.retroCompletionRate < 50) {
    predictionAnalysis.weaknesses.push(
      `闭环完成率低（${designer.retroCompletionRate}%），复盘数据不足`
    );
    predictionAnalysis.shortTerm.push('确保所有投放素材都完成T+3复盘');
  } else if (designer.retroCompletionRate > 80) {
    predictionAnalysis.strengths.push(
      `闭环完成率高（${designer.retroCompletionRate}%），数据积累充分`
    );
  }

  // 冷启动阶段分析
  if (designer.coldStartStage === 1) {
    predictionAnalysis.shortTerm.push(
      `冷启动阶段（${designer.sampleCount}/20条），当前使用行业基准预测`
    );
  } else if (designer.coldStartStage === 2) {
    predictionAnalysis.shortTerm.push(
      `数据积累中（${designer.sampleCount}/100条），预测精度逐步提升`
    );
  }

  // 影子模式分析
  if (designer.activeShadows.length > 0) {
    predictionAnalysis.shortTerm.push(
      `有${designer.activeShadows.length}个公式正在影子模式验证中，关注验证结果`
    );
  }

  // 标签生成扩展（新增预测相关标签）
  let label = existingLabel; // 保留现有标签逻辑

  if (designer.spearmanRho !== null) {
    if (designer.spearmanRho > 0.7 && designer.efficiencyScore > 70) {
      label = '预测精准型标杆';
    } else if (designer.spearmanRho > 0.7 && designer.retroCompletionRate > 80) {
      label = '闭环驱动型优化师';
    } else if (designer.spearmanRho < 0.4 && designer.coldStartStage === 1) {
      label = '冷启动期新人';
    }
  }

  return {
    ...existingAnalysis,
    predictionAnalysis,
    label, // 可能被更新
  };
}
```

### 4.8.6 ManagerReports 改动

**对应标准模式改动：** Reports 指标重定义（Spearman ρ、Top-K 命中率）

#### 全局汇总统计卡片扩展

```typescript
const summaryCards = [
  // ═══ 现有6个 ═══
  { title: '设计师数', value: designers.length },
  { title: '平均效率评分', value: avgEfficiency.toFixed(1) },
  { title: '平均CTR', value: `${avgCtr.toFixed(2)}%` },
  { title: '平均完播率', value: `${avgPlayRate.toFixed(2)}%` },
  { title: '平均CPM', value: `$${avgCpm.toFixed(2)}` },
  { title: '总花费', value: `$${totalSpend.toLocaleString()}` },

  // ═══ v2 新增2个 ═══
  {
    title: '团队排名相关性',
    value: teamSpearmanRho?.toFixed(3) ?? 'N/A',
    suffix: 'ρ',
    color: teamSpearmanRho > 0.6 ? '#52c41a' : '#ff4d4f',
  },
  {
    title: '团队Top-5命中率',
    value: `${teamTopKHitRate ?? 'N/A'}%`,
    color: teamTopKHitRate > 60 ? '#52c41a' : '#faad14',
  },
];
```

#### 新增图表：花费 vs 预测准确率散点图

```typescript
// 替换或新增一张散点图
const predictionScatterChart = {
  title: '花费 vs 预测准确率',
  tooltip: {
    formatter: (params) =>
      `${params.data.name}\n花费: $${params.data.x.toLocaleString()}\nρ: ${params.data.y.toFixed(3)}`,
  },
  xAxis: { name: '总花费 ($)', type: 'log' },
  yAxis: { name: 'Spearman ρ', min: 0, max: 1 },
  series: [{
    type: 'scatter',
    data: designers
      .filter(d => d.spearmanRho !== null)
      .map(d => ({
        x: d.totalSpend,
        y: d.spearmanRho,
        name: d.name,
        symbolSize: Math.max(10, d.materialCount / 2),
        itemStyle: {
          color: d.spearmanRho > 0.7 ? '#52c41a' :
                 d.spearmanRho > 0.6 ? '#faad14' : '#ff4d4f',
        },
      })),
  }],
  markLine: {
    data: [{ yAxis: 0.6, label: '合格线', lineStyle: { color: '#faad14', type: 'dashed' } }],
  },
};
```

#### DesignerCard 新增 section

```typescript
const getCardSections = (designer: DesignerStats): CardSection[] => [
  // ═══ 现有5个 section ═══
  // ...

  // ═══ v2 新增第6个 section ═══
  {
    title: '🎯 预测表现',
    content: (
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <Statistic
          title="排名相关性 (ρ)"
          value={designer.spearmanRho?.toFixed(3) ?? 'N/A'}
          valueStyle={{ color: designer.spearmanRho > 0.6 ? '#52c41a' : '#ff4d4f' }}
        />
        <Statistic title="Top-5命中" value={designer.topKHitRate ?? 'N/A'} suffix="%" />
        <Statistic title="闭环率" value={designer.retroCompletionRate} suffix="%" />
      </div>
    ),
  },
];
```

#### DesignerDetailModal 新增 section

```typescript
const getModalSections = (designer: DesignerStats): DetailSection[] => [
  // ═══ 现有5个 section ═══
  // ...

  // ═══ v2 新增第6个 section ═══
  {
    title: '🎯 预测-复盘详情',
    content: (
      <>
        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="排名相关性 (ρ)">
            <Tag color={designer.spearmanRho > 0.6 ? 'green' : 'red'}>
              {designer.spearmanRho?.toFixed(3) ?? 'N/A'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Top-5 命中率">{designer.topKHitRate ?? 'N/A'}%</Descriptions.Item>
          <Descriptions.Item label="中位数误差">{designer.medianError ?? 'N/A'}%</Descriptions.Item>
          <Descriptions.Item label="闭环完成率">{designer.retroCompletionRate}%</Descriptions.Item>
          <Descriptions.Item label="冷启动阶段">阶段{designer.coldStartStage}</Descriptions.Item>
          <Descriptions.Item label="进化贡献">{designer.evolutionContribution}次</Descriptions.Item>
        </Descriptions>

        <Divider>近期复盘记录</Divider>
        <Table
          size="small"
          pagination={{ pageSize: 5 }}
          columns={[
            { title: '素材', dataIndex: 'creativeName', ellipsis: true },
            { title: '预测CTR', dataIndex: 'predictedCtr' },
            { title: '实际CTR', dataIndex: 'actualCtr' },
            {
              title: '偏差等级',
              dataIndex: 'deviationLevel',
              render: (level: string) => (
                <Tag color={level === 'normal' ? 'green' : level === 'moderate' ? 'orange' : 'red'}>
                  {level === 'normal' ? '正常' : level === 'moderate' ? '中等' : '严重'}
                </Tag>
              ),
            },
          ]}
          dataSource={designer.recentRetros}
        />
      </>
    ),
  },
];
```

### 4.8.7 ManagerSafety / ManagerExecution / ManagerMemory 改动

这三个页面的改动较小，主要是数据展示层面的扩展：

#### ManagerSafety

```typescript
// 新增安全检查项：预测相关风险
const safetyChecks = [
  // ═══ 现有检查项 ═══
  // ...

  // ═══ v2 新增 ═══
  {
    title: '预测偏差告警',
    condition: designer.spearmanRho !== null && designer.spearmanRho < 0.3,
    level: 'warning',
    message: '预测能力极低，建议暂停依赖预测的自动化操作',
  },
  {
    title: '影子模式风险',
    condition: designer.activeShadows.some(s => s.successRate < 0.5),
    level: 'danger',
    message: '有影子模式验证成功率低于50%，新公式可能不如旧公式',
  },
];
```

#### ManagerExecution

```typescript
// 新增执行建议：基于预测结果
const executionSuggestions = [
  // ═══ 现有建议 ═══
  // ...

  // ═══ v2 新增 ═══
  {
    condition: designer.spearmanRho > 0.7,
    suggestion: '预测能力强，可考虑启用自动化投放决策',
    priority: 'info',
  },
  {
    condition: designer.spearmanRho < 0.4 && designer.coldStartStage === 1,
    suggestion: '冷启动阶段，建议先小预算测试积累数据，再启用自动化',
    priority: 'warning',
  },
];
```

#### ManagerMemory

```typescript
// 新增记忆分类：预测-复盘案例
const memoryCategories = [
  // ═══ 现有分类 ═══
  // ...

  // ═══ v2 新增 ═══
  {
    category: '预测-复盘案例',
    description: '自动存储预测偏差较大的素材案例，供团队学习',
    icon: '🎯',
    items: recentRetros.filter(r => r.deviationLevel === 'severe'),
  },
];
```

### 4.8.8 管理者模式改动工作量估算

| 页面 | 改动内容 | 工作量 |
|------|---------|--------|
| **ManagerDashboard** | +2汇总卡片 +1图表 +1卡片section +1弹窗section +反馈规则扩展 | 2天 |
| **ManagerCreativeInsight** | +1图表 +1弹窗section | 1天 |
| **ManagerDataDiagnosis** | +第七章(4节) +generateDesignerAnalysis第8维度 +标签扩展 | 3天 |
| **ManagerReports** | +2汇总卡片 +1散点图 +1卡片section +1弹窗section | 2天 |
| **ManagerSafety** | +2安全检查项 | 0.5天 |
| **ManagerExecution** | +2执行建议 | 0.5天 |
| **ManagerMemory** | +1记忆分类 | 0.5天 |
| **managerData.ts** | DesignerStats接口扩展 +computeDesignerStats新增字段 | 1天 |
| **合计** | — | **约10.5天** |

---

# 第五部分：实施路线图

## 5.1 四阶段实施计划（v2 调整）

### 第一阶段：闭环基础 + 安全地基（3-4周）

**目标：** 建立预测-复盘闭环，同时打好安全基础

| 任务 | 负责模块 | 工作量 | 备注 |
|------|---------|--------|------|
| 创建 ClickHouse 新表（含v2字段） | 🧠DATA | 1天 | 预测/复盘/进化日志 |
| 实现 `CreativePredictor`（含冷启动） | 🎨CREATIVE | 3天 | 三阶段降级 |
| 实现 `RetroEngine`（含异常清洗） | 🎨CREATIVE | 2天 | 清洗规则可配置 |
| 实现不确定度分解 | 🎨CREATIVE | 1天 | 三层分解 |
| 实现 `BlindnessGuard` | 🛡️SAFETY | 2天 | 数据边界+审计 |
| 新增预测/复盘 API | 🎨CREATIVE | 1天 | — |
| 前端「预测实验室」Tab（含冷启动提示） | 🎨CREATIVE | 3天 | — |
| 前端不确定度展示组件 | 🎨CREATIVE | 1天 | — |
| 前端数据访问清单组件 | 🛡️SAFETY | 1天 | 盲隔离透明化 |

### 第二阶段：公式进化 + 影子模式（3-4周）

**目标：** 实现公式自动进化 + 影子模式验证 + 一键回滚

| 任务 | 负责模块 | 工作量 | 备注 |
|------|---------|--------|------|
| 公式数据结构升级（含影子模式字段） | 🎨CREATIVE | 1天 | — |
| 实现 `FormulaManager` | 🎨CREATIVE | 2天 | — |
| 实现 `EvolutionSafetyNet` | 🛡️SAFETY | 3天 | 影子模式+回滚 |
| 实现多条件复合进化触发 | 🧠DATA | 2天 | RMSE+占比+冷却+时期 |
| 实现人工审核闸门 | 🛡️SAFETY | 1天 | — |
| Workshop 页面重构 | 🎨CREATIVE | 3天 | 信任等级+影子监控 |
| 进化日志展示（含审核记录） | 🎨CREATIVE | 1天 | — |
| 一键回滚功能 | 🎨CREATIVE | 1天 | — |

### 第三阶段：个性化 + 评分体系（2-3周）

**目标：** 实现个人评分体系 + 人工微调锁定

| 任务 | 负责模块 | 工作量 | 备注 |
|------|---------|--------|------|
| 实现 `PersonalRubric`（含三阶段） | 🎨CREATIVE | 3天 | — |
| 维度人工锁定功能 | 🎨CREATIVE | 1天 | — |
| 前端个性化雷达图 | 🎨CREATIVE | 2天 | 含维度来源标签 |
| 前端维度锁定交互 | 🎨CREATIVE | 1天 | — |
| 冷启动阶段提示组件 | 🎨CREATIVE | 1天 | — |

### 第四阶段：基准对比 + 指标优化（2周）

**目标：** 实现基准对比 + 业务指标重定义

| 任务 | 负责模块 | 工作量 | 备注 |
|------|---------|--------|------|
| 行业基准库构建（从竞品爬虫数据） | 💾MEMORY | 2天 | 按品类分层 |
| 实现 `BenchmarkComparator` | 💾MEMORY | 2天 | — |
| 前端基准对比面板 | 💾MEMORY | 2天 | — |
| 指标体系重构（Spearman ρ 等） | 🧠DATA | 2天 | — |
| Dashboard 指标卡片更新 | 🎨CREATIVE | 1天 | — |
| 全链路集成测试 | 🛡️SAFETY | 2天 | — |

### 第五阶段：管理者模式同步（2-3周）← v2.1 新增

**目标：** 将标准模式的所有改动同步到管理者模式7个页面

| 任务 | 负责模块 | 工作量 | 备注 |
|------|---------|--------|------|
| DesignerStats 接口扩展（新增预测字段） | 🧠DATA | 1天 | computeDesignerStats 新增计算逻辑 |
| ManagerDashboard：+2汇总卡片 +1图表 +卡片/弹窗section | 🎨CREATIVE | 2天 | 团队预测健康度 |
| ManagerCreativeInsight：+1图表 +弹窗section | 🎨CREATIVE | 1天 | 设计师预测排名对比 |
| ManagerDataDiagnosis：第七章(4节) + 第8分析维度 + 标签扩展 | 🧠DATA | 3天 | 最重要的算法引擎升级 |
| ManagerReports：+2汇总卡片 +1散点图 +卡片/弹窗section | 🎨CREATIVE | 2天 | 团队级指标 |
| ManagerSafety：+2安全检查项 | 🛡️SAFETY | 0.5天 | 预测偏差告警 |
| ManagerExecution：+2执行建议 | ⚡EXECUTION | 0.5天 | 基于预测的建议 |
| ManagerMemory：+1记忆分类 | 💾MEMORY | 0.5天 | 预测-复盘案例 |
| 管理者模式集成测试 | 🛡️SAFETY | 1天 | — |

## 5.2 风险与应对（v2 增强）

| 风险 | 影响 | v1 应对 | v2 增强应对 |
|------|------|---------|------------|
| 历史数据不足 | 预测精度低 | 显示"数据积累中" | 三阶段冷启动降级 + 行业基准兜底 |
| 公式进化过度拟合 | 过度适应近期 | 保留进化历史 | 影子模式验证 + 复合触发条件 + 冷却期 |
| 盲预测隔离不彻底 | 数据泄露 | 数据访问控制 | BlindnessGuard 审计 + 自动降级 + 透明化清单 |
| 计算资源消耗 | 大量计算 | 增量计算+缓存 | 同左 + 预计算行业基准缓存 |
| **v2: 影子模式期间表现恶化** | 新公式不如旧 | 无 | EvolutionSafetyNet 自动告警 + 一键回滚 |
| **v2: 特殊时期误触发进化** | 节假日数据失真 | 无 | 特殊时期检测 + 暂停进化 |
| **v2: 人工审核瓶颈** | 进化流程阻塞 | 无 | 信任等级设置（保守/标准/激进） |

## 5.3 成功指标（v2 重定义）

| 指标 | v1 定义 | v2 定义 | 目标值 | 衡量方式 |
|------|---------|---------|--------|---------|
| **核心预测指标** | 预测准确率 | Spearman ρ | > 0.6 | 预测排名与实际排名的相关性 |
| **Top-K命中率** | 无 | Top-5命中率 | > 60% | 预测前5中实际也在前5的比例 |
| **ROAS误差** | 绝对误差<20% | 中位数误差 | < 15% | 中位数绝对百分比误差 |
| **公式进化成功率** | 准确率提升 | ρ提升比例 | > 60% | 进化后排名相关性提升的比例 |
| **闭环完成率** | 有预测完成复盘 | 有效复盘率 | > 80% | 清洗后有效复盘/总预测 |
| **用户采纳率** | 使用预测功能率 | 预测后执行率 | > 50% | 预测后实际按预测执行的比例 |
| **v2: 影子模式通过率** | 无 | 验证通过率 | > 70% | 进入影子模式后最终生效的比例 |
| **v2: 冷启动可用性** | 无 | 阶段一可用率 | 100% | 新账户上线即可使用预测功能 |

---

# 总结

## v1 → v2 → v2.1 核心升级

| 维度 | v1 | v2 | v2.1 新增 |
|------|----|----|-----------|
| **安全性** | 信任机制 | 验证 + 回滚双保险（影子模式 + EvolutionSafetyNet） | ManagerSafety 预测偏差告警 |
| **冷启动** | "数据积累中"提示 | 三阶段降级（行业先验→混合→个性化） | ManagerDataDiagnosis 冷启动状态团队视图 |
| **预测鲁棒性** | 给一个置信度 | 不确定度分解 + 外部市场因子 | ManagerDashboard 团队预测健康度汇总 |
| **复盘精度** | 简单二分类 | 异常清洗 + 三级分级 + 复合触发 | ManagerCreativeInsight 设计师预测排名对比 |
| **盲隔离** | 概念定义 | 边界清晰 + BlindnessGuard 审计 + 自动降级 | ManagerDataDiagnosis 设计师预测能力排名 |
| **人机协作** | 偏自动 | 人工确认闸门 + 信任等级 + 维度锁定 | ManagerReports 团队级 Spearman ρ 散点图 |
| **成功指标** | 预测准确率 | Spearman ρ + Top-K命中率 + 中位数误差 | 管理者模式全部页面同步展示新指标 |
| **管理者模式** | 无改动 | 无改动 | 7个页面同步改动 + DesignerStats接口扩展 |

## Cheat-on-Content 给我们的最大启发

> **从「AI帮你生成内容」转向「AI帮你评判内容，并持续校准评判标准」**

你的系统目前偏向"生成"（创意简报、优化建议），而 Cheat-on-Content 的核心是"评判+进化"。把这两者结合，你的系统就能做到：

1. 先用 CLIP 打标 + 元素排名**分析素材**
2. 再用历史数据**预测表现**（含不确定度分解）
3. 发布后**自动复盘**（含异常清洗）
4. 根据复盘结果**进化公式**（影子模式验证）
5. 新公式**静默验证**5-10次后才生效
6. 表现恶化时**一键回滚**
7. 下一轮预测更准 → 形成**判断力的复利增长**

**v2 的核心理念：** 进化不是"开盲盒"，而是"受控实验"。

**v2.1 的核心补充：** 标准模式和管理者模式同步改动，确保团队视角和单人视角的数据一致性。

---

*v2.1 文档完成 | 2026-06-02*