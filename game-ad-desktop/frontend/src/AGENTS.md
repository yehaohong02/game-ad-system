<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-25 | Updated: 2026-05-25 -->

# src — 前端源代码

## Purpose
React应用的核心源码，包含页面、组件、状态管理、API服务和样式。

## Key Files

| File | Description |
|------|-------------|
| `App.tsx` | 根组件 — React Router路由配置（标准模式 + 管理者模式两套路由） |
| `main.tsx` | React DOM渲染入口 |
| `services/api.ts` | Axios实例，baseURL指向后端API |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `pages/` | 页面组件 — 10个标准页面 + 7个管理者页面 |
| `components/` | 通用组件 — Layout(3个)、manager(2个)、AddPlatformModal |
| `stores/` | Zustand状态管理 — 11个独立store |
| `styles/` | 全局CSS样式 |
| `data/` | 本地JSON数据（materialData.json / designerMaterialData.json / managerMaterialData.json）+ Mock数据 |

## Pages 页面清单

### 标准模式
| 文件 | 路由 | 说明 |
|------|------|------|
| `Dashboard.tsx` | `/` | 全局KPI看板、趋势图表 |
| `DataDiagnosis.tsx` | `/data-diagnosis` | 广告数据异常检测、Campaign+素材合并表格 |
| `CreativeInsightNew.tsx` | `/creative-insight` | 素材标签分析、元素效果排名 |
| `Execution.tsx` | `/execution` | Agent推理决策、广告操作执行 |
| `Safety.tsx` | `/safety` | 预算监控、熔断状态、操作审计 |
| `Memory.tsx` | `/memory` | 历史案例检索、经验总结 |
| `PlatformData.tsx` | `/platform-data` | 第三方竞品监测采集 |
| `Workshop.tsx` | `/workshop` | 创意工坊 |
| `Reports.tsx` | `/reports` | 日报/周报 |
| `Settings.tsx` | — | 应用设置 |

### 管理者模式
| 文件 | 路由 | 说明 |
|------|------|------|
| `manager/ManagerDashboard.tsx` | `/manager/dashboard` | 团队整体数据概览 |
| `manager/ManagerDataDiagnosis.tsx` | `/manager/data-diagnosis` | 设计师维度数据分析 |
| `manager/ManagerCreativeInsight.tsx` | `/manager/creative-insight` | 设计师素材表现对比 |
| `manager/ManagerExecution.tsx` | `/manager/execution` | 团队执行状态管理 |
| `manager/ManagerSafety.tsx` | `/manager/safety` | 团队预算安全监控 |
| `manager/ManagerMemory.tsx` | `/manager/memory` | 团队经验知识库 |
| `manager/ManagerReports.tsx` | `/manager/reports` | 团队级报表 |

## Stores 状态管理

| 文件 | 用途 | 状态 |
|------|------|------|
| `dashboard.ts` | 数据总览状态 | 独立（⚠️ 数据孤岛） |
| `dataDiagnosis.ts` | 数据诊断状态 | 独立 |
| `creativeInsight.ts` | 创意洞察状态（旧） | 独立 |
| `creativeInsightNew.ts` | 创意洞察状态（新） | 独立 |
| `execution.ts` | 执行闭环状态 | 独立 |
| `safety.ts` | 安全防护状态 | 已加载（实际用哪个待确认） |
| `memory.ts` | 记忆沉淀状态 | 独立 |
| `platformData.ts` | 平台数据状态 | 独立 |
| `managerMode.ts` | 管理者模式全局状态 | 独立 |
| `materialData.ts` | 素材数据共享状态 | 唯一共享store |
| `reports.ts` | 报表状态 | 独立 |

## For AI Agents

### Working In This Directory
- 新增页面需在 `App.tsx` 注册路由
- 新增 store 在 `stores/` 创建，页面通过 zustand hook 消费
- API调用统一通过 `services/api.ts`
- 管理者模式页面路由前缀 `/manager/`，sidebar 排除 `/platform` 和 `/workshop`

### ⚠️ Critical: 数据孤岛问题
11个Zustand store完全独立，materialData.json被3个页面各自静态导入。修复方向：
1. 以 `materialData.ts` 为共享数据源
2. 数据诊断/平台数据上传后写入共享Store → 响应式更新
3. 各模块派生数据改为从共享Store实时计算

### Testing Requirements
- Vite build 需通过（TypeScript编译）
- 前端功能验证：`npm run dev` → 浏览器访问 :5173

## Dependencies

### Internal
- `services/api.ts` → 后端API
- `stores/materialData.ts` → 共享数据层
- `electron/preload.ts` → Electron IPC（window.electronAPI）

### External
- antd — UI组件
- echarts-for-react — 图表
- zustand — 状态管理
- react-router-dom — 路由

<!-- MANUAL: -->