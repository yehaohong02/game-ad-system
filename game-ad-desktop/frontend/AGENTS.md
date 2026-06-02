<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-25 | Updated: 2026-05-25 -->

# frontend — React 前端

## Purpose
游戏买量系统的 React 前端界面，基于 Vite + TypeScript + Ant Design + ECharts。包含标准模式和**管理者模式**两套界面，使用 Zustand 管理状态。

## Tech Stack

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2+ | UI框架 |
| TypeScript | 5.3+ | 类型安全 |
| Vite | 5.1+ | 构建工具 |
| Ant Design (antd) | 5.15+ | UI组件库 |
| ECharts | 5.6+ | 图表 |
| Zustand | 4.5+ | 状态管理 |
| React Router | 6.22+ | 路由 |
| Axios | 1.6+ | HTTP请求 |
| dayjs | 1.11+ | 日期处理 |
| xlsx | 0.18+ | Excel导入导出 |

## Key Files

| File | Description |
|------|-------------|
| `package.json` | 前端依赖和脚本（dev/build/electron:dev） |
| `src/App.tsx` | 根组件，路由配置（标准模式 + 管理者模式） |
| `src/main.tsx` | React入口 |
| `src/services/api.ts` | API调用层（axios实例，baseURL: localhost:8000） |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/pages/` | 页面组件（Dashboard/DataDiagnosis/CreativeInsight等）（见 `src/AGENTS.md`） |
| `src/components/` | 通用组件（Layout/AppLayout/Sidebar/TopBar/manager/）（见 `src/AGENTS.md`） |
| `src/stores/` | Zustand状态管理（11个独立store）（见 `src/AGENTS.md`） |
| `src/services/` | API服务层 |
| `src/styles/` | 全局样式 |
| `src/data/` | 本地JSON数据文件（materialData.json等） |
| `data/` | Electron运行时数据存储（flows/screenshots/electron-dataeye） |

## For AI Agents

### Working In This Directory
- TypeScript strict mode
- UI组件使用 Ant Design（antd），图标用 @ant-design/icons
- 样式使用 antd 内置方案 + CSS modules
- API调用统一通过 `src/services/api.ts` 的 axios 实例

### 页面路由映射
| 路由 | 页面组件 | 说明 |
|------|---------|------|
| `/` | Dashboard | 数据总览 |
| `/data-diagnosis` | DataDiagnosis | 数据诊断 |
| `/creative-insight` | CreativeInsightNew | 创意洞察 |
| `/execution` | Execution | 执行闭环 |
| `/safety` | Safety | 安全防护 |
| `/memory` | Memory | 记忆沉淀 |
| `/platform-data` | PlatformData | 平台数据+竞品采集 |
| `/workshop` | Workshop | 创意工坊 |
| `/reports` | Reports | 报表中心 |
| `/manager/dashboard` | ManagerDashboard | 管理者看板 |
| `/manager/*` | manager/* | 管理者模式7个页面 |

### ⚠️ 已知问题
- **数据孤岛**：11个Zustand store完全独立，materialData.json被多个页面静态导入，上传数据后其他模块不会更新。待修复为共享数据Store。

### 启动命令
```bash
npm run dev              # Vite开发服务器 :5173
npm run build            # TypeScript + Vite构建
npm run electron:dev     # Electron开发模式（Vite + Electron并行）
npm run electron:build   # 构建 + Electron打包
```

## Dependencies

### Internal
- `src/services/api.ts` → 后端 `localhost:8000`
- `src/stores/*.ts` → 各页面的数据层
- `electron/preload.ts` → IPC桥接（通过 window.electronAPI）

### External
- antd / @ant-design/icons — UI组件库
- echarts / echarts-for-react — 图表
- zustand — 状态管理
- react-router-dom — 路由
- xlsx — Excel处理

<!-- MANUAL: -->